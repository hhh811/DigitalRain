//全局变量
var width = window.innerWidth					//窗口宽度
var height = window.innerHeight					//窗口高度
var streams = []								//字符流集合
var emphasizeP = 0.5							//高亮显示概率

var basicStreamRefreshInterval = 100			//基准字符流刷新基准间隔
var basicSwitchInterval = 20					//字符变换效果基准间隔
var minSpeed = 3								//字符下落最小速度
var maxSpeed = 8								//字符下落最大速度
var minStreamLen = 2							//最小字符流长度
var maxStreamLen = 15							//最大字符流长度
var minSymbolSize = 15							//最小字符大小
var maxSymbolSize = 20							//最大字符大小
var minFontOpacity = 0.6						//最大字符不透明度
var maxFontOpacity = 1							//最小字符不透明度

var numFrames = 0								//纪录刷新次数
var switchOn = true								//开关, 控制鼠标点击屏幕 开始/停止
var numAllLivingSymbols = 0						//当前字符对象数目

//下落字符
var stringToRain = "上班辛苦啦"				
var charFromString = stringToRain.split("")
var hiragana = []								//日文平假名
for (var i = 0; i < 96; i++) {
	hiragana.push(String.fromCharCode(0x30A0 + i))
}

var charCollection = hiragana				//字符集合

//生成颜色值函数
function rgba(r, g, b, a) {
	return "rgba(" + r + "," + g + "," +b + "," + a + ")"
}

// 设置屏幕
function setup() {
	//画布已存在,重设大小,并删除已有字符流
	if (document.getElementById("myCanvas")) {
		canvas.width = width
		canvas.height = height
		streams.splice(0, streams.length)
	} else {
		canvas = createCanvas(width, height)
		canvas.id = "myCanvas"
		body = document.getElementsByTagName("body")
		body[0].appendChild(canvas)
	}
	
	ctx = canvas.getContext("2d")
	
	var x = 0
	/* 实际效果 */
	while (x <= width) {
		var stream = new Stream(ctx, x)
		stream.generateSymbols()
		streams.push(stream)
		x += 0.5 * (maxSymbolSize + minSymbolSize)
	}
	
	/* test */
	// testStream = new Stream(ctx, 500)
	// testStream.generateSymbols()
}

// 动画
function draw() {
	numFrames++
	// time = (new Date()).getTime() - startTime
	ctx.fillStyle = 'rgba(0,0,0,0.3)'
	ctx.fillRect(0, 0, width, height)
	
	/* 实际效果 */
	streams.forEach(function(stream){
		stream.render()
		if ((numFrames - stream.lastRefreshFrame) >= stream.refreshInterval) {			//根据每个字符流自己的刷新间隔刷新stream
			stream.reset()
		}
	})
	
	if (numFrames % 100 == 0) {
		streams.forEach(function(stream){
			numAllLivingSymbols += stream.symbols.length
		})
		console.log(numAllLivingSymbols)
		numAllLivingSymbols = 0
	}
	
	/* test */
	// testStream.render()
	// if ((numFrames - testStream.lastRefreshFrame) >= testStream.refreshInterval) {
	// 		testStream.reset()
	// 		console.log(numFrames, testStream.lastRefreshFrame, testStream.refreshInterval)
	// 		console.log(testStream)
	// 	}
	
	
	raf = window.requestAnimationFrame(draw)
}

// 下坠字符
function Symbol(
		x, y, 				//字符位置
		ctx,				//画布对象的引用
		size,				//字符大小
		speed,				//下落速度
		emphasize,			//是否高亮显示
		emphasizeFontColor,	//高亮颜色
		ordFontColor		//普通颜色
		) {
	this.x = x
	this.y = y
	this.ctx = ctx
	this.size = size
	this.speed = speed
	this.emphasize = emphasize
	this.emphasizeFontColor = emphasizeFontColor
	this.ordFontColor = ordFontColor
	
	this.switchInterval = basicSwitchInterval + Math.round(Math.random() * 50)
	this.stop = false			//字符落到底端后是否停止循环,通过调用自身stopRain方法设置
	this.value					//字符值，通过字符编码计算得到
	this.setToRandomSymbol = function() {
		this.value = charCollection[Math.round(Math.random() * (charCollection.length - 1))]
	}
	
	//绘制symbol
	this.render = function() {
		if (this.emphasize) {
			this.ctx.fillStyle = this.emphasizeFontColor
		} else {
			this.ctx.fillStyle = this.ordFontColor
		}
		this.ctx.font = this.size + "px normal"
		this.ctx.textAlign = "center"
		this.ctx.fillText(this.value, this.x, this.y)
	}
	
	this.rain = function(){
		//字符下落
		if (this.y >= height && !this.stop){		//如果停止,则该字符不再返回屏幕顶端
			this.y = 0
		} else {
			this.y += this.speed
		}
		//字符随机变化
		if (Math.round(numFrames) % this.switchInterval == 0){
			this.setToRandomSymbol()
		}
	}
	
	//方法停止下落
	this.stopRain = function() {
		this.stop = true
	}
}

//数字流
function Stream(ctx, x) {
	this.ctx = ctx
	this.x = x					//stream的x坐标
	
	this.symbols = []			//字符流symbol集合
	this.totalSymbols = Math.round(Math.random() * (maxStreamLen - minStreamLen)) + minStreamLen		//每次字符流生成字符数
	this.speed = minSpeed + Math.random() * (maxSpeed - minSpeed)										//字符流下落速度
	this.resetToken = false																				//标记 用于执行reset
	this.refreshInterval = basicStreamRefreshInterval + Math.round(Math.random() * 50)					//下次字符流刷新间隔
	this.lastRefreshFrame = 0																			//纪录上次刷新的帧
	this.symbolSize = Math.round(Math.random() * (maxSymbolSize - minSymbolSize)) + minSymbolSize		//每次生成的字符大小
	this.fontOpacity = (Math.random() * (maxFontOpacity - minFontOpacity)) + minFontOpacity	//每次生成字符的不透明度
	this.emphasizeFontColor = rgba(180, 255, 180, this.fontOpacity)
	this.emphasizeFontColor = rgba(0, 255, 80, this.fontOpacity)
	
	//生成元素
	this.generateSymbols = function() {
		y = Math.random() * (-500)							//字符y坐标, -500让字符雨延迟出现
		var emphasize = Math.random() < emphasizeP			//只高亮显示第一个,概率p
		for (var i = 0; i < this.totalSymbols; i++) {
			symbol = new Symbol(
				this.x, y,
				this.ctx,
				this.symbolSize,
				this.speed,
				emphasize,
				this.emphasizeFontColor,
				this.ordFontColor
			)
			symbol.setToRandomSymbol()
			this.symbols.push(symbol)
			y -= this.symbolSize				//下一个数字紧挨在前一个上面
			emphasize = false					//只高亮显示第一个
		}
	}
	
	//在画布上绘制stream
	this.render = function() {
		this.symbols.forEach(function(symbol) {
			symbol.render()
			symbol.rain()
		})
		
		//如果symbol stop了,当其超出屏幕范围则删除
		for (var i = 1; i < this.symbols.length; i++) {
			if (this.symbols[i].stop && this.symbols[i].y > height) {
				this.symbols.splice(i, 1)
			}
		}
		// if (this.symbols[0].stop )
		
		//重置stream
		if (this.resetToken) {
			this.refresh()
			this.resetToken = false
		}
	}
	
	//重新生成stream,原来的symbol元素stop
	this.refresh = function() {
		this.symbols.forEach(function(symbol) {
			symbol.stopRain()
		})
		this.totalSymbols = Math.round(Math.random() * (maxStreamLen - minStreamLen)) + minStreamLen
		this.speed = minSpeed + Math.random() * (maxSpeed - minSpeed)
		this.refreshInterval = basicStreamRefreshInterval + Math.round(Math.random() * 50)
		this.symbolSize = Math.round(Math.random() * (maxSymbolSize - minSymbolSize)) + minSymbolSize
		this.lastRefreshFrame = numFrames			//纪录刷新时间
		this.fontOpacity = (Math.random() * (maxFontOpacity - minFontOpacity)) + minFontOpacity	//每次生成字符的不透明度
		this.emphasizeFontColor = rgba(180, 255, 180, this.fontOpacity)
		this.emphasizeFontColor = rgba(0, 255, 80, this.fontOpacity)
		this.generateSymbols()
	}
	
	//重设stream
	this.reset = function() {
		this.resetToken = true
	}
}

// 创建画布
function createCanvas(w, h) {
	canvas = document.createElement("canvas")
	canvas.width = w
	canvas.height = h
	canvas.style.backgroundColor = "black"
	return canvas
}

var startTime = (new Date()).getTime()
setup()
raf = window.requestAnimationFrame(draw)


//窗口大小变化重新开始
window.addEventListener("resize", function(){
	window.cancelAnimationFrame(raf)
	width = window.innerWidth
	height = window.innerHeight
	setup()
	raf = window.requestAnimationFrame(draw)
})

window.addEventListener("click", function(){
	if (switchOn) {
		window.cancelAnimationFrame(raf)
		switchOn = false
	} else {
		raf = window.requestAnimationFrame(draw)
		switchOn = true
	}
})