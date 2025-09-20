export interface ProgressBarOptions {
    container?: HTMLElement
    maxMegaPixels?: number
}

export interface ProgressBarAPI {
    update(currentMP: number): void
    destroy(): void
    getElement(): HTMLElement
}

const DEFAULT_MAX_MP = 9
const MEGAPIXEL_GRADIENT = 'linear-gradient(90deg, #00eaff 0%, #00ff7f 100%)'

function createProgressBar(options: ProgressBarOptions = {}): ProgressBarAPI {
    const maxMP = options.maxMegaPixels ?? DEFAULT_MAX_MP
    const container = options.container ?? document.body

    const barContainer = document.createElement('div')
    barContainer.style.marginTop = '50px'
    barContainer.style.width = '100%'
    barContainer.style.height = '70px'
    barContainer.id = 'megapixel-bar-container'

    const barRow = document.createElement('div')
    barRow.style.display = 'flex'
    barRow.style.alignItems = 'center'
    barRow.style.justifyContent = 'space-between'
    barRow.style.width = '100%'

    const minLabel = document.createElement('div')
    minLabel.textContent = '0.00'
    minLabel.style.fontSize = '14px'
    minLabel.style.color = '#23272e'
    minLabel.style.fontFamily = 'monospace'
    minLabel.style.textAlign = 'left'
    barRow.appendChild(minLabel)

    const barBg = document.createElement('div')
    barBg.id = 'megapixel-bar-bg'
    barBg.style.position = 'relative'
    barBg.style.height = '20px'
    barBg.style.background = '#23272e'
    barBg.style.border = '4px solid #222'
    barBg.style.borderRadius = '16px'
    barBg.style.flex = '1'
    barBg.style.margin = '0px 10px'
    barRow.appendChild(barBg)

    const maxLabel = document.createElement('div')
    maxLabel.textContent = maxMP.toFixed(2)
    maxLabel.style.fontSize = '14px'
    maxLabel.style.color = '#23272e'
    maxLabel.style.fontFamily = 'monospace'
    barRow.appendChild(maxLabel)

    barContainer.appendChild(barRow)

    const bar = document.createElement('div')
    bar.id = 'megapixel-bar'
    bar.style.position = 'absolute'
    bar.style.left = '0'
    bar.style.top = '0'
    bar.style.height = '100%'
    bar.style.width = '0'
    bar.style.background = MEGAPIXEL_GRADIENT
    bar.style.borderRadius = '12px 0 0 12px'
    bar.style.border = 'none'
    bar.style.transition = 'width 0.5s cubic-bezier(0.4, 1.2, 0.6, 1)'
    barBg.appendChild(bar)

    const markerDefs = [
        { mp: 1280 * 720 * 1e-6, color: '#1976d2', label: '0.92<br>(720p)' },
        { mp: 1920 * 1080 * 1e-6, color: '#0097a7', label: '2.07<br>(1080p)' },
        { mp: 2560 * 1440 * 1e-6, color: '#b98825', label: '3.69<br>(1440p)' },
        { mp: 3840 * 2160 * 1e-6, color: '#c62828', label: '8.29<br>(2160p)' },
    ]
    markerDefs.forEach((def) => {
        if (def.mp > maxMP) return // skip if marker is above max
        const percent = (def.mp / maxMP) * 100
        const marker = document.createElement('div')
        marker.style.position = 'absolute'
        marker.style.left = `${percent}%`
        marker.style.top = '0px'
        marker.style.width = '3px'
        marker.style.height = '100%'
        marker.style.background = def.color
        marker.style.borderRadius = '1px'
        barBg.appendChild(marker)
        if (def.label) {
            const label = document.createElement('div')
            label.style.position = 'absolute'
            label.style.left = `${percent}%`
            label.style.bottom = '0'
            label.style.fontSize = '12px'
            label.style.color = def.color
            label.style.fontWeight = 'bold'
            label.style.whiteSpace = 'nowrap'
            label.style.transform = 'translate(calc(-50% + 14px), 33px)'
            label.style.pointerEvents = 'none'
            label.innerHTML = def.label
            barBg.appendChild(label)
        }
    })

    const fillMarker = document.createElement('div')
    fillMarker.style.position = 'absolute'
    fillMarker.style.top = '-26px'
    fillMarker.style.width = '3px'
    fillMarker.style.height = '46px'
    fillMarker.style.background = 'linear-gradient(to top, #00ff7f 0%, #000 100%)'
    fillMarker.style.borderLeft = 'none'
    fillMarker.style.borderRadius = '2px'
    fillMarker.style.transition = 'left 0.5s cubic-bezier(0.4, 1.2, 0.6, 1)'
    barBg.appendChild(fillMarker)

    const markerValue = document.createElement('div')
    markerValue.style.position = 'absolute'
    markerValue.style.top = '-46px'
    markerValue.style.left = '0px'
    markerValue.style.fontSize = '14px'
    markerValue.style.fontFamily = 'monospace'
    markerValue.style.color = 'rgb(0, 0, 0)'
    markerValue.style.fontWeight = 'bold'
    markerValue.style.transform = 'translateX(-50%)'
    markerValue.style.whiteSpace = 'nowrap'
    markerValue.textContent = '0.00'
    barBg.appendChild(markerValue)

    container.appendChild(barContainer)

    function update(currentMP: number) {
        const percent = Math.max(0, Math.min(1, currentMP / maxMP))
        bar.style.width = `${percent * 100}%`
        bar.style.background = MEGAPIXEL_GRADIENT
        bar.style.boxShadow = '0 0 8px #00eaff, 0 0 4px #00ff7f'
        // Move fill marker, aligned with the progress bar fill
        // Use percent for left, so it always matches the bar's fill
        const markerWidth = 3
        fillMarker.style.left = `calc(${percent * 100}% - ${markerWidth / 2}px)`
        markerValue.style.left = `calc(${percent * 100}% )`
        markerValue.textContent = `${currentMP.toFixed(2)} MP`
    }

    function destroy() {
        if (barContainer.parentNode) {
            barContainer.parentNode.removeChild(barContainer)
        }
    }

    function getElement() {
        return barContainer
    }

    return { update, destroy, getElement }
}

export { createProgressBar }
