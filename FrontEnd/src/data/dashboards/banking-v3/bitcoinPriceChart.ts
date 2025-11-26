import { useThemeColors } from '/@src/composable/useThemeColors'

function generateDayWiseTimeSeries(s: number, count: number) {
  const values = [
    [5, 3, 7, 1, 9, 0, 4, 8, 2, 6, 10, 3, 7, 1, 9, 0, 4, 8],
    [1, 4, 6, 9, 2, 5, 0, 3, 7, 10, 8, 1, 4, 6, 9, 2, 5, 0],
    [7, 2, 5, 0, 3, 8, 1, 4, 6, 9, 10, 2, 5, 0, 3, 8, 1, 4],
  ]
  let i = 0
  const series = []
  let x = new Date('11 Nov 2020').getTime()
  while (i < count) {
    series.push([x, values[s][i]])
    x += 86400000
    i++
  }
  console.log(series)
  return series
}

export function useBitcoinPriceChart() {
  const themeColors = useThemeColors()

  // Función para obtener la altura relativa al tamaño de la pantalla
  function getChartHeight(): number {
    return window.innerHeight * 0.7 // Ajusta el factor según tus necesidades
  }

  const bitcoinChartOptions = {
    chart: {
      type: 'line',
      height: getChartHeight(),
      foreColor: '#999',
      stacked: true,
      toolbar: {
        show: false,
      },
      dropShadow: {
        enabled: true,
        enabledSeries: [0],
        top: -2,
        left: 2,
        blur: 5,
        opacity: 0.06,
      },
    },
    colors: [themeColors.secondary, themeColors.accent, themeColors.primary],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    title: {
      text: 'Bitcoin (BTC) Price Chart',
      align: 'left',
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 0,
      strokeColor: '#fff',
      strokeWidth: 3,
      strokeOpacity: 1,
      fillOpacity: 1,
      hover: {
        size: 6,
      },
    },
    xaxis: {
      type: 'datetime',
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        offsetX: 0,
        offsetY: -5,
      },
      tooltip: {
        enabled: true,
      },
    },
    grid: {
      show: false,
      padding: {
        left: -5,
        right: 5,
      },
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy',
      },
      y: {
        formatter: function (val: number) {
          return val + ''
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
    },
    fill: {
      type: 'solid',
      fillOpacity: 0.7,
    },
  }

  // Actualiza la altura del gráfico cuando cambia el tamaño de la ventana
  window.addEventListener('resize', () => {
    bitcoinChartOptions.chart.height = getChartHeight()
  })

  return {
    bitcoinChartOptions,
  }
}
