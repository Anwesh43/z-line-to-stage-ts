const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const scDiv : number = 0.51
const nodes : number = 5
const lines : number = 2
const strokeFactor : number = 90
const sizeFactor : number = 2.9
const foreColor : string = "#1A237E"
const backColor : string = "#BDBDBD"
const rotDeg : number = Math.PI / 4

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
    }

    static scaleFactor(scale : number) : number {
        return Math.floor(scale / scDiv)
    }

    static mirrorValue(scale : number, a : number, b : number) : number {
        const k : number = ScaleUtil.scaleFactor(scale)
        return (1 - k) / a + k / b
    }

    static updateValue(scale : number, dir : number, a : number, b : number) : number {
        return ScaleUtil.mirrorValue(scale, a, b) * dir * scGap
    }
}

class DrawingUtil {

    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawZLine(context : CanvasRenderingContext2D, i : number, size : number, w : number, sc1 : number, sc2 : number) {
        const a : number = size * Math.cos(Math.PI / 4)
        const b : number = size * Math.sin(Math.PI / 4)
        const sc1i : number = ScaleUtil.divideScale(sc1, i, lines)
        const sc2i : number = ScaleUtil.divideScale(sc2, i, lines)
        context.save()
        context.translate((w * sc2i - a) * (1 - 2 * i) , -b + 2 * b * (1 - i))
        context.rotate(-Math.PI / 4 * (1 - sc1i))
        DrawingUtil.drawLine(context, 0, 0, 2 * size * (1 - 2 * i), 0)
        context.restore()
    }

    static drawZTLNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        const gap : number = h / (nodes + 1)
        const size : number = gap / sizeFactor
        const sc1 : number = ScaleUtil.divideScale(scale, 0, 2)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, 2)
        const sc21 : number = ScaleUtil.divideScale(sc2, 0, 2)
        const sc22 : number = ScaleUtil.divideScale(sc2, 1, 2)
        if (scale > 0 && scale < 1) {
            console.log(`${sc1}, ${sc2}`)
        }
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.strokeStyle = foreColor
        context.save()
        context.translate(w / 2, gap * (i + 1))
        context.save()
        context.rotate(Math.PI / 4 * (1 -sc22))
        DrawingUtil.drawLine(context, 0, -size, 0, size)
        context.restore()
        for (var j = 0; j < lines; j++) {
            DrawingUtil.drawZLine(context, j, size, w / 2, sc1, sc21)
        }
        context.restore()
    }
}

class ZToLineStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : ZToLineStage = new ZToLineStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += ScaleUtil.updateValue(this.scale, this.dir, lines, lines * 2)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class ZTLNode {

    next : ZTLNode
    prev : ZTLNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new ZTLNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawZTLNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) {
        var curr : ZTLNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class ZToLine {

    root : ZTLNode = new ZTLNode(0)
    curr : ZTLNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    ztl : ZToLine = new ZToLine()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.ztl.draw(context)
    }

    handleTap(cb : Function) {
        this.ztl.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.ztl.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
