const Utils = require('./utils.js')
const Constant = require('./constant.js')
const RegExpUtils = require('./regExp.js')

class ContnetData {
  constructor() {
    this.OptionsContent = {} // 选项式属性映射
    this.OptionsContentKeys = {} // 选项式属性的值
    this.Importer = {
      vue: new Set(),
      vuex: new Set(),
      'vue-router': new Set(),
    }
    this.SetupOutupMaps = {
      emits: '',
      props: '',
      hooks: '',
      data: '',
      computed: '',
      watch: '',
      lifecycles: '',
    }
  }

  setContentKeys(vmContent) {
    this.OptionsContentKeys = {
      props: Object.keys(vmContent.props),
      data: Object.keys(vmContent.dataOptions),
      computed: Object.keys(vmContent.computed),
      watch: Object.keys(vmContent.watch),
      methods: Object.keys(vmContent.methods),
      lifecycles: Object.keys(vmContent.lifecycles),
    }
  }
  setContextContent(scriptMaps) {
    const data = {
      props: typeof scriptMaps.props === 'object' ? scriptMaps.props : {},
      data: typeof scriptMaps.data === 'function' ? scriptMaps.data : () => ({}),
      dataOptions: typeof scriptMaps.data === 'function' ? scriptMaps.data() : {},
      computed: typeof scriptMaps.computed === 'object' ? scriptMaps.computed : {},
      watch: typeof scriptMaps.watch === 'object' ? scriptMaps.watch : {},
      methods: typeof scriptMaps.methods === 'object' ? scriptMaps.methods : {},
      importer: { vue: [], 'vue-router': [], vuex: [] },
      lifecycles: {},
      hooks: new Set(),
      refs: new Set(),
      emits: new Set(),
    }
    this.OptionsContent = data
    this.setContentKeys(data)
  }
  setImpoter(key, prop) {
    if (!Object.keys(this.Importer).includes(key)) {
      return
    }
    this.Importer[key].add(prop)
  }
  setLifeCycles(contentData) {
    const lifecycleData = {}
    for (const attr in contentData) {
      if (Constant.LIFE_CYCLES.includes(attr) && Utils.getPrototype(contentData[attr]) === 'function') {
        lifecycleData[attr] = contentData[attr]
      }
    }
    this.OptionsContent.lifecycles = lifecycleData
    this.OptionsContentKeys.lifecycles = Object.keys(lifecycleData)
  }
  addVueImpoter(attribute) {
    this.setImpoter('vue', attribute)
  }
}
const vmData = new ContnetData()

const transformContentStr = value => {
  let result = ''
  switch (Utils.getPrototype(value)) {
    case 'string':
      return `${value}`
      break
    case 'array':
      const values = []
      for (const i of value) {
        const content = transformContentStr(i)
        values.push(content)
      }
      if (values?.length) {
        return `[${values.join(',\n')}]`
      } else {
        return '[]'
      }
      break
    case 'object':
      const objValues = []
      for (const i in value) {
        const content = transformContentStr(value[i])
        objValues.push(`${i}:${content}`)
      }
      if (objValues.length) {
        return `{\n${objValues.join(',\n')}\n}`
      } else {
        return '{}'
      }
      break
    case 'function':
      let content = value.toString()
      if (Constant.NAVITE_ARR.includes(value?.name) && content.match(RegExpUtils.bracesRegExp)?.[0] === '{ [native code] }') {
        return `${value.name}`
      } else {
        content = replaceKeywords(content)
        const args = content.match(RegExpUtils.parenthesisRegExp)?.[0] || '()'
        const bodyStartSort = content.indexOf(args) + args.length
        const bodyData = content.substring(bodyStartSort).match(RegExpUtils.bracesRegExp)?.[0] || '{}' // 匹配到{}里面的数据
        if (Utils.isAsyncFunction(value)) {
          return `async ${args}=>${bodyData}`
        } else {
          return `${args}=>${bodyData}`
        }
      }
      break
    default:
      return `${value}`
      break
  }

  return result
}
const replaceKeywords = content => {
  const { OptionsContent, OptionsContentKeys } = vmData

  let result = content.replace(RegExpUtils.thisKeyRegExp, function (replaceStr, separator, key, offset, rawcontent) {
    if (OptionsContentKeys.props.includes(key)) {
      return `props.${key}`
    } else if (OptionsContentKeys.data.includes(key)) {
      return `state.${key}`
    } else if (OptionsContentKeys.methods.includes(key)) {
      return `${key}`
    } else if (OptionsContentKeys.computed.includes(key)) {
      return `${key}.value`
    } else if (key === '$attrs') {
      vmData.setImpoter('vue', 'useAttrs')
      OptionsContent.hooks.add('attrs')
      return `${key.substring(1)}`
    } else if (key === '$slots') {
      vmData.setImpoter('vue', 'useSlots')
      OptionsContent.hooks.add('slots')
      return `${key.substring(1)}`
    } else if (key === '$refs') {
      const refVal = rawcontent.substring(offset + replaceStr.length).match(RegExpUtils.refRegExp)?.[2] || ''
      if (refVal) {
        OptionsContent.refs.add(refVal)
      }
      return `${refVal}.value`
    } else if (key === '$emit') {
      const emitVal = rawcontent.substring(offset + replaceStr.length).match(RegExpUtils.emitRegExp)?.[2] || ''
      if (emitVal) {
        OptionsContent.emits.add(emitVal)
      }
      return `${key.substring(1)}`
    } else if (key === '$nextTick') {
      vmData.setImpoter('vue', 'nextTick')
      return `${key.substring(1)}`
    } else if (key === '$router') {
      vmData.setImpoter('vue-router', 'useRouter')
      OptionsContent.hooks.add('router')
      return `${key.substring(1)}`
    } else if (key === '$route') {
      vmData.setImpoter('vue-router', 'useRoute')
      OptionsContent.hooks.add('route')
      return `${key.substring(1)}`
    } else if (key === '$store') {
      vmData.setImpoter('vuex', 'useStore')
      OptionsContent.hooks.add('store')
      return `${key.substring(1)}`
    } else if (Constant.V2_OTHER_FN.includes(key)) {
      vmContent.Importer['vue'].add('getCurrentInstance')
      OptionsContent.hooks.add('vue')
      return `proxy.${key}`
    } else if (key) {
      return `/* UnKnown this.${key} origin*/ proxy.${key}`
    }
  })

  return result
}
const replaceAndGetKeys = key => {
  OptionsContentKeys = vmData.OptionsContentKeys
  if (!key) return ''
  let result = ''
  if (OptionsContentKeys.props?.includes(key)) {
    result = `porps.${key}`
  } else if (OptionsContentKeys.data?.includes(key)) {
    result = `state.${key}`
  } else if (OptionsContentKeys.computed?.includes(key)) {
    result = `${key}.value`
  } else {
    result = `${key}`
  }
  return result
}

const getPackageImport = () => {
  const { Importer } = vmData
  const importResult = []
  for (const ele in Importer) {
    const values = Array.from(Importer[ele])
    if (values.length) {
      const item = `import {${Array.from(Importer[ele]).join(',')}} from '${ele}'`
      importResult.push(item)
    }
  }
  return `${importResult.join('\n')}`
}

const SetContentMethods = {
  props: () => {
    const { OptionsContentKeys, OptionsContent, SetupOutupMaps } = vmData
    if (OptionsContentKeys.props?.length) {
      const propsStr = transformContentStr(OptionsContent.props)
      if (propsStr.length) {
        SetupOutupMaps.props = `const props = defineProps(${propsStr})`
      }
    }
  },
  data: () => {
    const { OptionsContentKeys, OptionsContent, SetupOutupMaps } = vmData
    if (OptionsContentKeys.data?.length) {
      const dataStr = transformContentStr(OptionsContent.dataOptions)
      if (dataStr) {
        if (dataStr) {
          SetupOutupMaps.data = `const state = reactive(${dataStr})`
          vmData.addVueImpoter('reactive')
        }
      }
    }
  },
  computed: () => {
    const { OptionsContentKeys, OptionsContent, SetupOutupMaps } = vmData
    if (OptionsContentKeys.computed?.length) {
      const computedResult = []
      for (const prop of OptionsContentKeys.computed) {
        const computedItemStr = transformContentStr(OptionsContent.computed[prop])
        const itemRow = (data = `const ${prop} = computed(${computedItemStr})`)
        computedResult.push(itemRow)
      }
      if (computedResult.length) {
        SetupOutupMaps.computed = computedResult.join('\n')
        vmData.addVueImpoter('computed')
      }
    }
  },
  watch: () => {
    const { OptionsContentKeys, OptionsContent, SetupOutupMaps } = vmData
    if (OptionsContentKeys.watch?.length) {
      const result = []
      for (const prop of OptionsContentKeys.watch) {
        const watchContnet = OptionsContent.watch[prop]
        if (watchContnet && Utils.getPrototype(watchContnet) === 'function') {
          const watchfnStr = transformContentStr(watchContnet)
          const deps = replaceAndGetKeys(prop, OptionsContentKeys)
          if (deps && watchfnStr) {
            result.push(`watch(()=> ${deps}, ${watchfnStr})`)
          }
        } else if (watchContnet && Utils.getPrototype(watchContnet) === 'object' && Utils.getPrototype(watchContnet.handler) === 'function') {
          const { handler, ...options } = watchContnet
          const watchfnStr = transformContentStr(handler)
          const deps = replaceAndGetKeys(prop, OptionsContentKeys)
          const watchOptions = transformContentStr(options)
          if (watchfnStr && deps && options) {
            result.push(`watch(()=> ${deps},${watchfnStr},${watchOptions})`)
          }
        }
      }
      if (result.length) {
        SetupOutupMaps.watch = result.join('\n')
        vmData.addVueImpoter('watch')
      }
    }
  },
  methods: () => {
    const { OptionsContentKeys, OptionsContent, SetupOutupMaps } = vmData
    if (OptionsContentKeys.methods?.length) {
      const result = []
      for (const prop of OptionsContentKeys.methods) {
        const computedItemStr = transformContentStr(OptionsContent.methods[prop])
        const itemRow = (data = `const ${prop} = ${computedItemStr}`)
        result.push(itemRow)
      }
      if (result.length) {
        SetupOutupMaps.methods = result.join('\n')
      }
    }
  },
  lifecycles: () => {
    const { OptionsContentKeys, OptionsContent } = vmData
    if (OptionsContentKeys.lifecycles?.length) {
      const result = []
      for (const lifeName of OptionsContentKeys.lifecycles) {
        const lifeBodyStr = transformContentStr(OptionsContent.lifecycles[lifeName])
        let itemRow = ''
        if (Constant.CREATE_CYCLES.includes(lifeName)) {
          itemRow = `${lifeBodyStr}` // 这两个直接放setup执行
        } else if (Constant.EXCLUDE_CREATE_CYCLES.includes(lifeName)) {
          const lifecycleName = Constant.V3_HOOKS[lifeName]
          itemRow = `${lifecycleName}(${lifeBodyStr})`
          vmData.addVueImpoter(lifecycleName)
        }
        result.push(itemRow)
      }
      if (result.length) {
        vmData.SetupOutupMaps.lifecycles = result.join('\n')
      }
    }
  },
  emits: () => {
    const { OptionsContentKeys, SetupOutupMaps, OptionsContent } = vmData
    if (OptionsContent.emits?.size > 0) {
      const emitsArr = Array.from(OptionsContent.emits)
      const emitValues = emitsArr.map(i => `'${i}'`)
      SetupOutupMaps.emits = `const emit = defineEmits([${emitValues.join(',')}])`
    }
  },
  refs: () => {
    const { OptionsContentKeys, SetupOutupMaps, OptionsContent } = vmData
    if (OptionsContent.refs?.size > 0) {
      const refsArr = Array.from(OptionsContent.refs)
      const refValues = refsArr.map(i => `const ${i}= ref(null)`)
      SetupOutupMaps.refs = refValues.join('\n')
      vmData.addVueImpoter('ref')
    }
  },
  hooks: () => {
    const { OptionsContent, SetupOutupMaps } = vmData
    const hooksArr = Array.from(OptionsContent.hooks)
    const hooksStr = []
    if (hooksArr?.length) {
      for (const hook of hooksArr) {
        hooksStr.push(Constant.USE_HOOKS_MAP[hook])
      }
      SetupOutupMaps.hooks = hooksStr.join('\n')
    }
  },
}

module.exports = {
  ContnetData: vmData,
  contentUtils: {
    replaceKeywords,
    replaceAndGetKeys,
    transformContentStr,
  },
  getPackageImport,
  SetupOutupMaps: vmData.SetupOutupMaps,
  SetContentMethods,
}
