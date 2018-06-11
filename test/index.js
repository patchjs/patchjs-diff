/* eslint-env node, mocha */
import expect from 'expect.js';
import calcDiffData from '../src/index.js';
import fs from 'fs';

const testPath = __dirname;

function mergeCode (source, chunkSize, diffCodeArray) {
  var jsCode = '';
  for (var i = 0, len = diffCodeArray.length; i < len; i++) {
    var code = diffCodeArray[i];
    if (typeof code === 'string') {
      jsCode += code;
    } else {
      var start = code[0] * chunkSize;
      var end = code[1] * chunkSize;
      jsCode += source.substr(start, end);
    }
  }
  return jsCode;
}

describe('index.js', () => {
  it('calcDiffData (localFileContent, fileContent)', () => {
    // same content
    expect(calcDiffData('var num = 0;', 'var num = 0;')).to.eql({
      l: 20,
      m: false,
      c: []
    });

    // replace content
    expect(calcDiffData('var num = 0;var str = "string1";', 'var num = 1;var str = "string2";')).to.eql({
      l: 20,
      m: true,
      c: ['var num = 1;', 'var str = "string2";']
    });
    // add content
    expect(calcDiffData('var num = 0;";', 'var num = 0;var str = "string2";')).to.eql({
      l: 20,
      m: true,
      c: [ 'var num = 0;', 'var str = "string2";' ]
    });
    // remove content
    expect(calcDiffData('var num = 0;var str = "string1";', 'var num = 0;')).to.eql({
      l: 20,
      m: true,
      c: ['var num = 0;']
    });
    // big file content
    const source = fs.readFileSync(`${testPath}/data/antd-mobile.min.js`, {encoding: 'utf8'});
    const target = fs.readFileSync(`${testPath}/data/antd-mobile.min.change.js`, {encoding: 'utf8'});
    // const source = fs.readFileSync(`${testPath}/data/zepto.min.js`, {encoding: 'utf8'});
    // const target = fs.readFileSync(`${testPath}/data/zepto.min.change.js`, {encoding: 'utf8'});
    const diffResult = calcDiffData(source, target);
    console.log(diffResult);
    expect(mergeCode(source, diffResult.l, diffResult.c)).to.eql(target);
  });
});
