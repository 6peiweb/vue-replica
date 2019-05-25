function Vue (options) {
  this.$options = options || {}
  var data = this._data = this.$options.data
  var self = this

  // 使用 vm 代理 vm.$data，数据代理
  Object.keys(data).forEach(function (key) {
    self._proxyData(key)
  })

  // 初始化计算属性
  this._initComputed()

  // 监听数据变化
  observe(data)
  this.$compile = new Compiler(options.el || document.body, this)
}

Vue.prototype = {
  $watch: function (key, cb) {
    new Watcher(this, key, cb)
  },
  _proxyData: function (key) {  // 将 vm 代理 vm.$data
    var self = this
    Object.defineProperty(self, key, {
      enumerable: true,
      configurable: false,
      get: function () {
        return self._data[key]
      },
      set: function (newVal) {
        self._data[key] = newVal
      }
    })
  },
  _initComputed: function () { // 获取计算属性的值
    var self = this
    var computed = this.$options.computed
    if (typeof computed === 'object') {
      Object.keys(computed).forEach(function (key) {
        Object.defineProperty(self, key, {
          get: function () {
            var getFnOrVal = computed[key]
            if (typeof getFnOrVal !== 'function') return getFnOrVal
            getFnOrVal.call(self)
          }
        })
      })
    }
  }
}