function Observer (data) {
  this.data = data
  this.init(data)
}

Observer.prototype = {
  init: function (data) {
    var self = this
    Object.keys(data).forEach(function (key) {
      self.defineReactive(data, key, data[key]) // 给每一个属性定义 getter 和 setter 
    })
  },
  defineReactive: function (data, key, value) {
    var dep = new Dep() // 每一个被监听的对象内定义一个
    observe(value) // 遍历监听子属性

    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false, // 不可再 define
      get: function () {
        if (Dep.target) {
          dep.depend()
        }
        return value
      },
      set: function (newVal) {
        if (newVal === value) return
        value = newVal
        observe(value) // 如果新值为 object ，需要重新遍历监听
        dep.notify() // 值变化通知订阅者
      }
    })
  }
}

function observe (value) {
  if (!value || typeof value !== 'object') return
  return new Observer(value)
}

function getDepUid () {
  return Math.random()
    .toString(36)
    .substring(7)
    .split('')
    .join('.')
}

function Dep () {
  this.id = getDepUid()
  console.log(this.id);
  this.subs = []
}

Dep.prototype = {
  addSub: function (sub) {
    this.subs.push(sub)
  },
  depend: function () {
    Dep.target.addDep(this)
  },
  removeSub: function (sub) {
    var index = this.subs.indexOf(sub)
    if (index !== -1) {
      this.subs.splice(index, 1)
    }
  },
  notify: function () {
    this.subs.forEach(function (sub) {
      sub.update()
    })
  }
}

Dep.target = null