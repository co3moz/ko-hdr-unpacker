#!/usr/bin/env node
/* eslint-disable no-process-exit, no-empty */

const program = require('commander');
const hdrunpack = require('../lib/hdrunpack');
const path = require('path');

program
  .usage('<file>')
  .version('1.0.1')
  .parse(process.argv);

if (!program.args.length) return program.help();

let arg = program.args[0];
let location = path.resolve(arg);

hdrunpack(location).catch(x => {
  console.error('an Error occurred!, ' + x.message);
})
