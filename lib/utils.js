const RegExpUtils = require('./regExp.js')

const isAsyncFunction = value => {
  return value.constructor.name === 'AsyncFunction'
}

const getPrototype = value => {
  return Object.prototype.toString
    .call(value)
    .replace(/^\[object (\S+)\]$/, '$1')
    .toLowerCase()
}

const matchModules = contentStr => {
  const { templateRegex, scriptRegex, styleRegex } = RegExpUtils
  const templateStr = contentStr.match(templateRegex)?.[1]?.trim() || ''
  const scriptStr = contentStr.match(scriptRegex)?.[1]?.trim() || ''
  const styleStr = contentStr.match(styleRegex)?.[1]?.trim() || ''
  return {
    templateStr,
    scriptStr,
    styleStr,
  }
}


module.exports = {
  matchModules,
  isAsyncFunction,
  getPrototype,
}
