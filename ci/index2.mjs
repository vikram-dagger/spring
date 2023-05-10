import { connect } from '@dagger.io/dagger'

connect(async (client) => {

  if(!process.env.DOCKERHUB_USERNAME) {
    console.log('DOCKERHUB_USERNAME environment variable must be set');
    process.exit();
  }
  if(!process.env.DOCKERHUB_PASSWORD) {
    console.log('DOCKERHUB_PASSWORD environment variable must be set');
    process.exit();
  }

  const username = process.env.DOCKERHUB_USERNAME;

  const password = client.setSecret('password', process.env.DOCKERHUB_PASSWORD);

  const mavenCache = client.cacheVolume('maven-cache');

  const hostDir = client.host().directory('.', { exclude: ['ci/'] });

  const mariadb = client
    .container()
    .from('mariadb:10.11.2')
    .withEnvVariable('MARIADB_USER', 'petclinic')
    .withEnvVariable('MARIADB_PASSWORD', 'petclinic')
    .withEnvVariable('MARIADB_DATABASE', 'petclinic')
    .withEnvVariable('MARIADB_ROOT_PASSWORD', 'root')
    .withExposedPort(3306)
    .withExec([]);

	const maven = client.container()
    .from('maven:3.9-eclipse-temurin-17')
		.withMountedCache('/root/.m2', mavenCache)
		.withMountedDirectory('/app', hostDir)
		.withWorkdir('/app');

  const test = await maven
    .withServiceBinding('db', mariadb)
    .withExec(['mvn', '-Dspring.profiles.active=mysql', 'clean', 'test'])
    .stdout();

    /*
  const targetDir = maven
    .withExec(['mvn', '-Dspring.profiles.active=mysql', 'clean', 'package'])
    .directory('./target');

  const imageRef = await client.container()
    .from('eclipse-temurin:17-alpine')
    .withDirectory('/app', targetDir)
    .withEntrypoint(['java', '-jar', '/app/spring-petclinic-3.0.0-SNAPSHOT.jar'])
    .withRegistryAuth('docker.io', username, password)
    .publish(`docker.io/${username}/mypetclinic`);

  console.log(imageRef);
  */

  // test with
  // docker run -p 8080:8080 vikramatdagger/mypetclinic:latest

}, { LogOutput: process.stderr })
