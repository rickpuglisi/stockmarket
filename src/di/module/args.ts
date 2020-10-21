import { IPWL_ApproximationArguments, IUpdatePWL_ApproximationArguments } from "../../pwl_approximation/interfaces";

export class PWL_ApproximationArguments implements IPWL_ApproximationArguments, IUpdatePWL_ApproximationArguments {
        constructor(public myParameter: number) {}

        public getParameter(): number {
            return this.myParameter;
        }

        public setParameter(param: number) {
            this.myParameter = param;
        }
    }
