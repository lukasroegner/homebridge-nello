/* eslint-disable import/no-extraneous-dependencies */

import { writeFileSync } from 'fs'
import { resolve } from 'path';

import * as TJS from 'typescript-json-schema';

import { PLATFORM_NAME } from '../src/config';

const settings: TJS.PartialArgs = {
  required: true,
};

const program = TJS.programFromConfig(resolve(__dirname, '../tsconfig.bin.json'));
const schema = TJS.generateSchema(program, 'Config', settings);

const homebridgeConfigUIXSchema = {
  pluginAlias: PLATFORM_NAME,
  pluginType: 'platform',
  singular: true,
  schema,
};

writeFileSync(
  resolve(__dirname, '../config.schema.json'),
  JSON.stringify(homebridgeConfigUIXSchema, null, 2),
  'utf8',
);
