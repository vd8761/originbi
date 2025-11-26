import { AppDataSource } from '../ormconfig';

AppDataSource.initialize()
  .then(() => AppDataSource.runMigrations())
  .then(() => console.log('Migrations executed'))
  .catch(err => console.error(err));
