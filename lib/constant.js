// apis
const NAVITE_ARR = [
  "String",
  "Boolean",
  "Array",
  "Number",
  "Object",
  "Function",
  "Symbol",
];

const V2_OTHER_FN = [
  "$data",
  "$props",
  "$el",
  "$options",
  "$parent",
  "$root",
  "$children",
  "$isServer",
  "$listeners",
  "$watch",
  "$on",
  "$set",
  "$delete",
  "$once",
  "$off",
  "$mount",
  "$forceUpdate",
  "$destroy",
];

// lifecycles
const V3_HOOKS = {
  beforeMount: "onBeforeMount",
  mounted: "onMounted",
  beforeUpdate: "onBeforeUpdate",
  updated: "onUpdated",
  beforeDestroy: "onBeforeUnmount",
  destroyed: "onUnmounted",
  activated: "onActivated",
  deactivated: "onDeactivated",
};

const LIFE_CYCLES = [
  "beforeCreate",
  "created",
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeDestroy",
  "destroyed",
];
const CREATE_CYCLES = ["created", "beforeCreate"];
const EXCLUDE_CREATE_CYCLES = [
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeDestroy",
  "destroyed",
  "activated",
  "deactivated",
];

const USE_HOOKS_MAP = {
  router: "const router = useRouter()",
  store: "const store = useStore()",
  attrs: "const attrs = useAttrs()",
  route: "const route = useRoute()",
  slots: "const slots = useSlots()",
  vue: "const { proxy } = getCurrentInstance()",
};

module.exports = {
  LIFE_CYCLES,
  CREATE_CYCLES,
  EXCLUDE_CREATE_CYCLES,
  V3_HOOKS,
  USE_HOOKS_MAP,
  NAVITE_ARR,
  V2_OTHER_FN,
};
