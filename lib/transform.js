const fs = require('fs')
const chalk = require('chalk')
const RegExpUtils = require('./regExp.js')
const beautify = require('js-beautify')
const Utils = require('./utils')
const Constant = require('./constant')
const ConvertUtils = require('./convert')
const ContnetData = ConvertUtils.ContnetData

const transform = options => {
  const { filepath } = options
  const fileContent = fs.readFileSync(filepath).toString()
  const { templateStr, scriptStr, styleStr } = Utils.matchModules(fileContent) //

  const topImportString = scriptStr.match(RegExpUtils.importRegex)?.[0]
  const result = beautify(scriptStr.substring(topImportString?.length))
  const modelScriptContent = (function () {
    const { componentsRegExp, mixinsRegExp, bracesRegExp } = RegExpUtils
    return result
      .match(/\{[\s\S]*\}/g)?.[0]
      .replace(/components: ((\{\})|(\{[\s\S]+?\}))[\,\n]/, '')
      .replace(/mixins: ((\[\])|(\[([\s\S]+?)\]))[\,\n]/, '')
  })()
  let scriptData
  eval(`scriptData= ${modelScriptContent.replace('export default', '')}`)

  ContnetData.setContextContent(scriptData)
  ContnetData.setLifeCycles(scriptData)
  
  for (const option in ConvertUtils.SetContentMethods) {
    const method = ConvertUtils.SetContentMethods[option]
    method()
  }
  const packageImportStr = ConvertUtils.getPackageImport()
  const setupStr = Object.values(ConvertUtils.SetupOutupMaps).join('\n')
  const hasPropsData = ConvertUtils.SetupOutupMaps.props?.length
  const template = `${packageImportStr}
  ${topImportString}
  export default {
  setup(${hasPropsData ? 'props' : ''}) {
    ${setupStr}
  }
};
`
  return `<template>${templateStr}</template><script>${beautify(template)}</script>${styleStr}`
}
module.exports = transform
