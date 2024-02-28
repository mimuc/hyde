import * as path from 'path';
import { promises as fs } from 'fs';
import * as tf from '@tensorflow/tfjs-node';
import { GrMLDataSet } from './datasets';
import * as jimp from 'jimp';

export async function loadPetDataset (offset: number = 0, pagesize?: number): Promise<[ number[][][], number ][]> {
  const rootdir = path.join('..', 'app', GrMLDataSet.PETS.toString());
  const dirlist = await fs.readdir(rootdir);

  const imgGroups: [ number[][][], number ][][] = await Promise.all(dirlist.map(async (dir, i) => {
    const files: string[] = (await fs.readdir(path.join(rootdir, dir))).slice(offset, pagesize ? offset + pagesize : undefined);
    return Promise.all(files.map(async (file) => {
      const imgPath = path.join(rootdir, dir, file);
      const img = await jimp.read(imgPath);
      return [ await tf.browser.fromPixels(img.bitmap).array(), i ];
    }));
  }));

  return (<[ number[][][], number ][]> [ ]).concat(...imgGroups);
}
