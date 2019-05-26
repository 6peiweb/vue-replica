function Watcher (vm, expOrFn, cb) {
  this.vm = vm
  this.expOrFn = expOrFn
  this.cb = cb
  this.depIds = {}
  
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn
  } else {
    this.getter = this.parseGetter(expOrFn.trim())
  }

  this.value = this.get()
}

Watcher.prototype = {
  update: function () {
    this.run()
  },
  run: function () {  // 每次执行 run 都会重新比较当前值与保存的旧值
    var value = this.get()
    var oldVal = this.value
    if (value !== oldVal) {
      this.value = value
      this.cb.call(this.vm, value, oldVal)
    }
  },
  addDep: function (dep) {  // 订阅属性变更
    if (!this.depIds.hasOwnProperty(dep.id)) {
      dep.addSub(this)
      this.depIds[dep.id] = dep
    }
  },
  get: function () {  // 获取属性当前值
    Dep.target = this
    var value = this.getter.call(this.vm, this.vm)
    Dep.target = null
    return value
  },
  parseGetter: function (exp) { // 如果监听的是一个属性，则从 vm.$data 中遍历返回该属性的值
    if (/[^\w.$]/.test(exp)) return
    var exps = exp.split('.')
    return function (obj) {
      var len = exps.length
      for (var i = 0; i < len; i ++) {
        if (!obj) return
        obj = obj[exps[i]]
      }
      return obj
    }
  }
}