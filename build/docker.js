const child_process = require('child_process');
const version = process.env.npm_package_version;
const npm_registry = process.env.npm_registry || ''; // TODO: if use maven artifactory
const docker_repository = process.env.docker_repository || ''; // TODO
const base_image_source = process.env.base_image_source || `${docker_repository}/base-images`;
const base_image_version = process.env.base_image_version || '1.0.0';
const tag = `${docker_repository}/ai_scores/pwl_approximation:${version}`;
const args = [
    `--build-arg BASE_IMAGE_SOURCE=${base_image_source}`,
    `--build-arg BASE_IMAGE_VERSION=${base_image_version}`,
    `--build-arg NPM_REGISTRY=${npm_registry}`
].join(' ');
child_process.execSync(`docker build -t ${tag} ${args} .`, { stdio: 'inherit' });
child_process.execSync(`docker push ${tag}`, { stdio: 'inherit' });
