import { IPWL_Algorithm, IPWL_ApproximationDocument, IPWL_ApproximationResult, IPWL_Channel, IPWL_DataPoint } from "./interfaces";
import { getLogger } from "../logging/logger";

const logger = getLogger("pwl_algorithm");

export class PWL_Algorithm implements IPWL_Algorithm {
  public date = new Date();
  public slope: number[][] = [];
  public intercept: number[][] = [];
  public error: number[][] = [];
  public cost: number[][] = [];
  public breakpoints: number[][] = [];
  public xpoints: number[][] = [];
  public channels: IPWL_Channel[] = [];
  private sumX: number[] = [];
  private sumX2: number[] = [];
  private sumXY: number[] = [];
  private sumY: number[] = [];
  private yHat: number[] = []; 
  constructor(
    public name: string,
    public interval: string,
    public numSegments: number,
    public numPoints: number,
    public keys: string[],
    public x: number[],
    public y: number[],
  ) {
    // initialize
    for (let i = 0; i < this.numPoints; i++) {
      this.error[i] = new Array(this.numPoints);
      this.slope[i] = new Array(this.numPoints);
      this.intercept[i] = new Array(this.numPoints);
      this.cost[i] = new Array(this.numSegments);
      this.breakpoints[i] = new Array(this.numSegments);
      this.xpoints[i] = new Array(this.numSegments);
    }
  }

  /**
   * This finds a fixed number of line segments that best fit the data.
   * This uses algorithm 1 of "Componogara & Nazari"
   * This algorithm first finds the best starting points for each segment
   * Then to retrieve results we start at the last segment and move backwards
   * to get each segment's starting point
   * @param useBreakPoints - flag to determine if use regression or connect data points
   * @returns {IPWL_ApproximationDocument[]} - the mongodb documents to store
   */
  public findFixedNumSegments(
    useBreakPoints: boolean = true
  ): IPWL_ApproximationDocument[] {
    if (useBreakPoints) {
      // each line has endpoints that are data points (3.1)
      this.initializeBreakpoints();
    } else {
      // each line is the result of a regression on a set of data points
      this.initializeRegression();
    }
    this.fixedNum_DataPointSegments();
    const result = {
      indices: [],
      slopes: [],
      intercepts: [],
      xpoints: [],
    }
    // ending index must always be last point
    result.indices[this.numSegments] = this.numPoints - 1;
    // get last segment's starting index
    let startingPoint = this.breakpoints[this.numPoints - 1][
      this.numSegments - 1
    ];
    // for each remaining segment (from back to front)
    for (let i = this.numSegments - 1; i >= 0; i--) {
      result.indices[i] = startingPoint;
      // slope from starting index to ending index
      result.slopes[i] = this.slope[startingPoint][result.indices[i + 1]];
      result.intercepts[i] = this.intercept[startingPoint][result.indices[i + 1]];
      // get the next segment's starting index
      startingPoint = this.breakpoints[startingPoint][i - 1];
    }
    this.getChannels(result);
    return this.writeSegments(result);
  }

  /**
   * This finds a set of continous line segments that fit the data but the breakpoints
   * are not data points but the xpoints (between the data points).
   */
  public findFixedRejectDiscontinousSegments(): IPWL_ApproximationDocument[] {
    // each line is the result of a regression on a set of data points
    this.initializeRegression();
    this.fixedNum_XPointSegments();
    const result = {
      indices: [],
      slopes: [],
      intercepts: [],
      xpoints: [],
    }
    // ending index must always be last point
    result.indices[this.numSegments] = this.numPoints - 1;
    // get last segment's starting index
    let startingPoint = this.breakpoints[this.numPoints - 1][
      this.numSegments - 1
    ];
    let endingPoint = this.numPoints - 1;
    // for each remaining segment (from back to front)
    for (let i = this.numSegments - 1; i >= 0; i--) {
      result.indices[i] = startingPoint;
      // slope from starting index to ending index
      result.slopes[i] = this.slope[startingPoint][result.indices[i + 1]];
      result.intercepts[i] = this.intercept[startingPoint][result.indices[i + 1]];
      result.xpoints[i] = this.xpoints[endingPoint][i];
      // get the next segment's starting index
      endingPoint = startingPoint;
      startingPoint = this.breakpoints[startingPoint][i - 1];
    }
    // starting point of first segment is always first point
    result.xpoints[0] = this.x[0];
    this.getChannels(result);
    return this.writeSegments(result);
  }

  /**
   * This finds a set of continous line segments that fit the data but the breakpoints
   * are not data points.  It solves two quadratic programming problems.  This will
   * produce a result with a smaller error than the findFixedRejectDiscontinousSegments
   * function.
   */
  public findQPSegments(): IPWL_ApproximationDocument[] {
    // TODO?: Not sure if worth doing
    return;
  }

  public getSeries(segments: IPWL_ApproximationDocument[]): IPWL_DataPoint[] {
    const series: IPWL_DataPoint[] = [];
    let j = 0;
    for (let i=0; i < this.x.length; i++) {
      if (this.x[i] > segments[j].endingXPoint) {
        j++;
      }
      series.push({
        x: this.keys[i],
        y: this.y[i],
        yHat: this.yHat[i],
        ub: this.yHat[i] + this.channels[j].ub,
        lb: this.yHat[i] - this.channels[j].lb
      })
    }
    return series;
  }

  /**
   * This function generates a matrix of costs and optimal starting points
   * assuming a fixed number of segments. It also assumes that the end points
   * of the segments (x-values) are one of the data point's x-values
   * The number of rows equal the number of data points
   * The number of columns equal the number of segments
   * The matrices will be used to identify the best segments
   */
  private fixedNum_DataPointSegments() {
    // for each data point; will find best starting points given j
    for (let j = 0; j < this.numPoints; j++) {
      // assign cost of first segment candidates;
      // first segment must start from 0 index of array and assume end at j index
      this.cost[j][0] = this.error[0][j];
      // the first segment must start from 0 index of array
      this.breakpoints[j][0] = 0;
      // initialize remaining segments given j
      for (let t = 1; t < this.numSegments; t++) {
        // will minimize so initialize to max value
        this.cost[j][t] = Number.MAX_VALUE;
        // initialize value outside of array bounds
        this.breakpoints[j][t] = -1;
      }
      // for each possible segment given j (except the first segment t=0)
      for (let t = 1; t < Math.min(j, this.numSegments); t++) {
        // for each starting point candidate of this segment
        for (let i = t; i < j; i++) {
          // cost of previous segment to this starting point plus cost of this segment (i to j)
          const cost = this.cost[i][t - 1] + this.error[i][j];
          // if this segment's starting point i is best candidate (given j) then save cost and i
          if (this.cost[j][t] > cost) {
            this.cost[j][t] = cost;
            this.breakpoints[j][t] = i;
          }
        }
      }
    }
    logger.debug("costs = " + JSON.stringify(this.cost));
    logger.debug("breakdpoints = " + JSON.stringify(this.breakpoints));
    return;
  }

  /**
   * This function generates a matrix of costs and optimal starting points
   * assuming a fixed number of segments. However, the starting/ending points
   * of the segments can have x-values that are between two data points.
   * The slopes and intercepts are constrained to be determined by regressions 
   * of the datapoints in the corresponding segment but continous at xpoints
   * The value for y is y = intercept + slope * x so the starting and ending points
   * do not have to be on the regression line segments
   * The number of rows equal the number of data points
   * The number of columns equal the number of segments
   * The matrices will be used to identify the best segments and their x-values
   */
  private fixedNum_XPointSegments() {
    // for each data point; will find best starting points given j
    for (let j = 0; j < this.numPoints; j++) {
      // assign cost of first segment candidates;
      // first segment must start from 0 index of array and assume end at j index
      this.cost[j][0] = this.error[0][j];
      // the first segment must start from 0 index of array
      this.breakpoints[j][0] = 0;
      // the first segment must start at the first point
      this.xpoints[j][0] = 0;
      // initialize remaining segments given j
      for (let t = 1; t < this.numSegments; t++) {
        // will minimize so initialize to max value
        this.cost[j][t] = Number.MAX_VALUE;
        // initialize value outside of array bounds
        this.breakpoints[j][t] = -1;
        // initialize the xpoints
        this.xpoints[j][t] = 0;
      }
      // for each possible segment given j (except the first segment t=0)
      for (let t = 1; t < Math.min(j, this.numSegments); t++) {
        // for each starting point candidate of this segment
        for (let i = t; i < j; i++) {
          const k = this.breakpoints[i][t-1];
          if (k >= 0) {
            const dSlope = this.slope[i][j] - this.slope[k][i];
            if (dSlope !== 0) {
              const x = (this.intercept[k][i] - this.intercept[i][j]) / dSlope;
              // cost of previous segment to this starting point plus cost of this segment (i to j)
              const cost = this.cost[i][t - 1] + this.error[i][j];
              const xMax = Math.max(...(this.x.slice(0,i)));
              const xMin = Math.min(...(this.x.slice(i + 1,this.numPoints)));
              if (x >= xMax && x <= xMin && this.cost[j][t] > cost) {
                this.cost[j][t] = cost;
                this.breakpoints[j][t] = i;
                this.xpoints[j][t] = x;
              }
            }
          }
        }
      }
    }
    logger.debug("costs = " + JSON.stringify(this.cost));
    logger.debug("breakdpoints = " + JSON.stringify(this.breakpoints));
    logger.debug("xpoints = " + JSON.stringify(this.xpoints));
    return;
  }

  /**
   * This function calculates the potential segments and their errors
   * using a best-fit linear regression
   */
  private initializeRegression() {
    // generate error matrix
    this.buildSummations();
    for (let i = 0; i < this.numPoints; i++) {
      this.error[i][i] = Number.MAX_VALUE;
      for (let j = i + 1; j < this.numPoints; j++) {
        this.slope[i][j] = this.getRegressionSlope(i, j);
        this.intercept[i][j] = this.getRegressionIntercept(i, j);
        this.error[i][j] = this.getSumSqErrors(i, j);
      }
    }
  }

  /**
   * This function calculates the potential segments and their errors
   * using a line connecting two data points
   */
  private initializeBreakpoints() {
    for (let i = 0; i < this.numPoints; i++) {
      this.error[i][i] = Number.MAX_VALUE;
      for (let j = i + 1; j < this.numPoints; j++) {
        this.slope[i][j] = this.getBreakpointSlope(i, j);
        this.intercept[i][j] = this.getBreakpointIntercept(i, j);
        this.error[i][j] = this.getSumSqErrors(i, j);
      }
    }
  }

  /**
   * This function computes the parameters for a linear regression from 0 to j
   * later these values will be reduced by removing data points from the sum
   */
  private buildSummations() {
    this.sumX[0] = this.x[0];
    this.sumX2[0] = Math.pow(this.x[0], 2);
    this.sumXY[0] = this.x[0] * this.y[0];
    this.sumY[0] = this.y[0];
    for (let j = 1; j < this.numPoints; j++) {
      this.sumX[j] = this.x[j] + this.sumX[j - 1];
      this.sumX2[j] = Math.pow(this.x[j], 2) + this.sumX2[j - 1];
      this.sumXY[j] = this.x[j] * this.y[j] + this.sumXY[j - 1];
      this.sumY[j] = this.y[j] + this.sumY[j - 1];
    }
  }

  /**
   * compute the slope from a best-fit linear regression
   * @param i - the starting point of the segment
   * @param j - the ending point of the segment
   * @returns {number} the slope of the segment
   */
  private getRegressionSlope(i: number, j: number): number {
    const n = j - i + 1;
    if (i > 0) {
      // remove previous i value from sums
      this.sumX[j] -= this.x[i - 1];
      this.sumX2[j] -= Math.pow(this.x[i - 1], 2);
      this.sumXY[j] -= this.x[i - 1] * this.y[i - 1];
      this.sumY[j] -= this.y[i - 1];
    }
    const numerator = n * this.sumXY[j] - this.sumX[j] * this.sumY[j];
    const denominator = n * this.sumX2[j] - Math.pow(this.sumX[j], 2);
    const slope = denominator ? numerator / denominator : 0;
    return slope;
  }

  /**
   * compute the intercept from a best-fit linear regression
   * @param i - the starting point of the segment
   * @param j - the ending point of the segment
   * @returns {number} the intercept of the segment
   */
  private getRegressionIntercept(i: number, j: number): number {
    const n = j - i + 1;
    // slope has already adjusted the sums
    const intercept = (this.sumY[j] - this.slope[i][j] * this.sumX[j]) / n;
    return intercept;
  }

  /**
   * compute the slope from a line connecting two data points
   * @param i - the starting point of the segment
   * @param j - the ending point of the segment
   * @returns {number} the slope of the segment
   */
  private getBreakpointSlope(i: number, j: number): number {
    const numerator = this.y[j] - this.y[i];
    const denominator = this.x[j] - this.x[i];
    const slope = denominator ? numerator / denominator : 0;
    return slope;
  }

  /**
   * compute the intercept from a line connecting two data points
   * @param i - the starting point of the segment
   * @param j - the ending point of the segment
   * @returns {number} the intercept of the segment
   */
  private getBreakpointIntercept(i: number, j: number): number {
    const intercept = this.y[i] - this.slope[i][j] * this.x[i];
    return intercept;
  }

  /**
   * compute the sum of squared errors for a candidate segment
   * @param i - the starting point of the segment
   * @param j - the ending point of the segment
   * @returns {number} the sum of the squared errors
   */
  private getSumSqErrors(i: number, j: number): number {
    let error = 0;
    for (let k = i; k <= j; k++) {
      error += Math.pow(
        this.y[k] - this.slope[i][j] * this.x[k] - this.intercept[i][j],
        2
      );
    }
    return error;
  }

  private getChannels(result: IPWL_ApproximationResult) {
    let j = 0;
    let ub = 0;
    let lb = 0;
    for (let i=0; i < this.x.length; i++) {
      if (this.x[i] > result.xpoints[j + 1]) {
        this.channels[j] = {ub: ub, lb: lb};
        // reset
        j++;
        ub = 0;
        lb = 0;
      }
      this.yHat[i] = result.intercepts[j] + result.slopes[j] * this.x[i];
      // get channel widths
      if (this.y[i] - this.yHat[i] > ub) {
        ub = this.y[i] - this.yHat[i];
      }
      if (this.yHat[i] - this.y[i] > lb) {
        lb = this.yHat[i] - this.y[i];
      }
    }
    this.channels[j] = {ub: ub, lb: lb};
  }

  private writeSegments(result: IPWL_ApproximationResult): IPWL_ApproximationDocument[] {
    const numSegments = result.indices.length - 1;
    const docs: IPWL_ApproximationDocument[] = [];
    for (let i = 0; i < numSegments; i++) {
      docs.push({
        date: this.date,
        symbol: this.name,
        interval: this.interval,
        segmentNumber: i + 1,
        startingIndex: result.indices[i],
        endingIndex: result.indices[i + 1],
        startingXPoint: result.xpoints[i],
        endingXPoint: result.xpoints[i + 1],
        startingVertex: 0,
        endingVertex: 0,
        slope: result.slopes[i],
        intercept: result.intercepts[i],
        upperBound: this.channels[i].ub,
        lowerBound: this.channels[i].lb,
        channelWidth: this.channels[i].ub + this.channels[i].lb,
        channelLength: result.indices[i + 1] - result.indices[i],
      });
    }
    return docs;
  }
}
