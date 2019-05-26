function Compiler (el, vm) {
  this.$vm = vm
  this.$el = this.isElementNode(el) ? el : document.querySelector(el) // 获取组件绑定的根节点
  if (this.$el) {
    this.$fragment = this.node2Fragment(this.$el) // 将 dom 节点转换成文档碎片进行解析编译操作，降低性能消耗
    this.init()
    this.$el.appendChild(this.$fragment)
  }
}

Compiler.prototype = {
  node2Fragment: function (el) {
    var fragment = document.createDocumentFragment()
    var child
    while (child = el.firstChild) { // 将 dom 节点添加到文档碎片中
      fragment.appendChild(child)
    }
    return fragment
  },
  init: function () {
    this.compileElement(this.$fragment)
  },
  compileElement: function (fragment) {
    var childNodes = fragment.childNodes
    var self = this
    ~[].slice.call(childNodes).forEach(function (node) {
      var text = node.textContent
      var reg = /\{\{(.*)\}\}/
      
      if (self.isElementNode(node)) { // 编译普通 dom 节点中的指令
        self.compile(node)
      } else if (self.isTextNode(node) && reg.test(text)) { // 编译带 data 的 Text 节点
        self.compileText(node, RegExp.$1.trim())
      }
      if (node.childNodes && node.childNodes.length) { // 遍历编译 dom tree
        self.compileElement(node)
      }
    })
  },
  compile: function (node) {
    var nodeAttrs = node.attributes
    var self = this
    ~[].slice.call(nodeAttrs).forEach(function (attr) {
      var attrName = attr.name
      if (self.isDirective(attrName)) { // 判断属性是否是指令属性
        var exp = attr.value
        var dir = attrName.substring(2)
        if (self.isEventDirective(dir)) { // 事件指令，绑定事件
          compileUtil.eventHandle(node, self.$vm, exp, dir)
        } else {  // 执行其他绑定指令
          compileUtil[dir] && compileUtil[dir](node, self.$vm, exp)
        }
        node.removeAttribute(attrName)
      }
    })
  },
  compileText: function (node, exp) {
    compileUtil.text(node, this.$vm, exp)
  },
  isDirective: function (attr) {
    return attr.indexOf('v-') === 0 || attr.indexOf('@') === 0 || attr.indexOf(':') === 0
  },
  isEventDirective: function (dir) {
    return dir.indexOf('on') === 0
  },
  isElementNode: function (node) {
    return node.nodeType === 1
  },
  isTextNode: function (node) {
    return node.nodeType === 3
  }
}

var compileUtil = {
  text: function (node, vm, exp) {
    this.bind(node, vm, exp, 'text')
  },
  html: function (node, vm, exp) {
    this.bind(node, vm, exp, 'html')
  },
  model: function (node, vm, exp) {
    this.bind(node, vm, exp, 'model')
    var self = this
    var val = this._getVMVal(vm, exp)
    node.addEventListener('input', function (e) {
      var newValue = e.target.value
      if (val === newValue) return
      self._setVMVal(vm, exp, newValue)
      // val = newValue
    })
  },
  class: function (node, vm, exp) {
    this.bind(node, vm, exp, 'class')
  },
  bind: function (node, vm, exp, dir) {
    var updaterFn = updater[dir + 'Updater']
    updaterFn && updaterFn(node, this._getVMVal(vm, exp))
    new Watcher(vm, exp, function (value, oldValue) {
      updaterFn && updaterFn(node, value, oldValue)
    })
  },
  eventHandle: function (node, vm, exp, dir) {
    var eventType = dir.split(':')[1]
    var fn = vm.$options.methods && vm.$options.methods[exp]

    if (eventType && fn) {
      node.addEventListener(eventType, fn.bind(vm), false)
    }
  },
  _getVMVal: function (vm, exp) { // 从 vm.$data 中层层获取数据
    var val = vm
    exp = exp.split('.')
    exp.forEach(function (key) {
      val = val[key]
    })
    return val
  },
  _setVMVal: function (vm, exp, value) {
    var val = vm
    exp = exp.split('.')
    exp.forEach(function (key, index) {
      if (index < exp.length - 1) { // 非最后一个 key 进行更替
        val = val[key]
      } else {  // 对最后一个 key 进行值更新
        val[key] = value
      }
    })
  }
}

var updater = {
  textUpdater: function (node, value) { // 更新 text
    node.textContent = typeof value === 'undefined' ? '' : value
  },
  htmlUpdater: function (node, value) { // 更新 html
    node.innerHTML = typeof value === 'undefined' ? '' : value
  },
  classUpdater: function (node, value, oldValue) { // 更新className
    var className = node.className
    className = className.replace(oldValue, '').replace(/\s$/, '')
    var space = className && String(value) ? ' ' : ''
    node.className = className + space + value
  },
  modelUpdater: function (node, value) { // 更新双向数据绑定的 value
    node.value = typeof value === 'undefined' ? '' : value
  }
}