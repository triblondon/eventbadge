/* eslint-env browser */

document.addEventListener('DOMContentLoaded', () => {
  const cont = document.querySelector('.attendees-list')
  const stream = new EventSource('/stream')
  const popMessages = [
    'Commendable',
    'Nice one',
    'Good job',
    'Highly performant',
    'Exemplary',
    'Cooking with gas',
    'Right on',
    'Bravo Zulu',
    'Hooah',
    'First class',
    'Cracking',
    'Outstanding',
    'Tip top',
    'Rad',
    'Capital',
    'Marvellous',
    'Smashing',
    'Nicely done',
    'Super duper',
    'That\'s the ticket',
    'Magnificent',
    'Extraordinary',
    'Fabulous',
    'Singular',
    'Stupendous',
    'Terrific'
  ]

  let layoutTimer

  function layout () {
    cont.classList.remove('rendered')
    clearTimeout(layoutTimer)
    layoutTimer = setTimeout(() => {

      const itemCount = document.querySelectorAll('.attendee').length
      const contWidth = cont.offsetWidth
      const contHeight = cont.offsetHeight
      const idealRatio = 12
      const maxCols = 5
      const minItemWidth = 200
      const fontSizeRatio = 2.5 // px of item height for each px of font size

      let bestRatio = 1000
      let thisRatio
      let bestColCount, thisColCount
      let thisItemHeight, thisItemWidth, bestItemHeight

      for (thisColCount = 1; thisColCount <= maxCols; thisColCount++) {
        thisItemWidth = contWidth / thisColCount
        thisItemHeight = contHeight / Math.ceil(itemCount / thisColCount)
        thisRatio = thisItemWidth / thisItemHeight
        if (Math.abs(idealRatio - thisRatio) < Math.abs(idealRatio - bestRatio) && thisItemWidth > minItemWidth) {
          bestRatio = thisRatio
          bestColCount = thisColCount
          bestItemHeight = thisItemHeight
        }
      }

      cont.style.fontSize = (bestItemHeight / fontSizeRatio) + 'px'

      if (!cont.classList.contains('cols-' + bestColCount)) {
        cont.classList.remove('cols-1', 'cols-2', 'cols-3', 'cols-4', 'cols-5')
        cont.classList.add('cols-' + bestColCount)
      }
      cont.classList.add('rendered')
    }, 250)
  }

  stream.addEventListener('checkin', e => {
    const attendee = JSON.parse(e.data)
    const attendeeEl = document.getElementById('attendee-' + attendee.id)
    const popEl = document.createElement('div')
    attendeeEl.classList.add('checked-in')
    popEl.className = 'pop pop-' + Math.ceil(Math.random() * 3)
    popEl.style.top = attendeeEl.offsetTop + 'px'
    popEl.style.left = attendeeEl.offsetLeft + 'px'
    popEl.innerHTML = popMessages[Math.floor(Math.random() * popMessages.length)]
    popEl.addEventListener('animationend', () => {
      popEl.remove()
    })
    document.body.appendChild(popEl)
  }, false)

  stream.addEventListener('uncheckin', e => {
    const attendee = JSON.parse(e.data)
    document.getElementById('attendee-' + attendee.id).classList.remove('checked-in')
  }, false)

  document.addEventListener('click', async e => {
    if (e.target.matches('.print-btn')) {
      const button = e.target
      e.preventDefault()
      button.classList.add('activity')

      const resp = await fetch(button.dataset.href, { method: 'post' })
      const result = await resp.json()

      if (result === true) {
        button.classList.remove('activity')
      } else {
        console.log(result)
      }
    }
  })

  layout()
  window.addEventListener('resize', layout)

})
