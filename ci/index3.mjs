import { connect } from '@dagger.io/dagger'

connect(async (client) => {

  const mavenCache = client.cacheVolume('maven-cache');

  const hostDir = client.host().directory('.', { exclude: ['ci/'] });

	const maven = client.container()
    .from('maven:3.9-eclipse-temurin-17')
		.withMountedCache('/root/.m2', mavenCache)
		.withMountedDirectory('/app', hostDir)
		.withWorkdir('/app');

  await maven
    .withExec(['mvn', 'clean', 'package'])
    .directory('./target')
    .export('./target');

}, { LogOutput: process.stderr })
