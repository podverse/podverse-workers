import { AppDataSourceRead, ItemAbout } from 'podverse-orm';
import { Repository } from 'typeorm';

export const sandboxRun = async () => {
  const repositoryRead = AppDataSourceRead.getRepository(ItemAbout) as Repository<ItemAbout>;
  const where = {"item":{"id":99}};
  const config = { relations: ['item_itunes_episode_type'] };
  const data = await repositoryRead.findOne({ where, ...config });
  console.log(data);
};
