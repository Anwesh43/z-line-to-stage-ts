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
        const sc1i : number = ScaleUtil.divideScale(sc1, i, lines)
        const sc2i : number = ScaleUtil.divideScale(sc2, i, lines)
        context.save()
        context.translate(w * sc2i, -size + 2 * size * i)
        context.rotate(Math.PI / 4 * sc1i)
        DrawingUtil.drawLine(context, 0, 0, 0, -2 * size * (1 - 2 * i))
        context.restore()
    }

    static drawZTLNode(context : CanvasRenderingContext2D, scale : number, i : number) {
        const gap : number = h / (nodes + 1)
        const size : number = gap / sizeFactor
        const sc1 : number = ScaleUtil.divideScale(scale, 0, 2)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, 2)
        const sc21 : number = ScaleUtil.divideScale(sc2, 0, 2)
        const sc22 : number = ScaleUtil.divideScale(sc2, 1, 2)
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.strokeStyle = foreColor
        context.save()
        context.translate(w / 2, gap * (i + 1))
        context.rotate(Math.PI / 4 * (1 -sc22))
        DrawingUtil.drawLine(context, 0, -size, 0, size)
        for (var j = 0; j < lines; j++) {
            DrawingUtil.drawZLine(context, j, size, w / 2, sc1, sc21)
        }
        context.restore()
    }
}

class ZToLineStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = foreColor
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : ZToLineStage = new ZToLineStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}
