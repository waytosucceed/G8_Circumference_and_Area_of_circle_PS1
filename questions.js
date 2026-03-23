var questions = []
var i = 0
var count = 0
var score = 0
var Ansgiven = []
var previousQuestionIndex = null
var topicName = ''
const submitSound = document.getElementById('submit-sound')

const uniqueKey = 'G8_Circumference of circle, semicircle and quarter circle'

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function saveToLocalStorage(key, value) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {}
  storageData[key] = value
  localStorage.setItem(uniqueKey, JSON.stringify(storageData))
}

function getFromLocalStorage(key) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {}
  return storageData[key]
}

// ─── Fetch questions ──────────────────────────────────────────────────────────
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    const urlParams = new URLSearchParams(window.location.search)
    topicName = urlParams.get('topic')

    const selectedTopic = data.topics.find(t => t.heading === topicName)

    if (selectedTopic) {
      questions = selectedTopic.questions
      count = questions.length

      const savedAnswers = getFromLocalStorage('Ansgiven')
      if (savedAnswers && Array.isArray(savedAnswers) && savedAnswers.length === count) {
        Ansgiven = savedAnswers
      } else {
        Ansgiven = new Array(count).fill(null)
      }

      saveToLocalStorage(topicName + '_totalQuestions', count)
      document.getElementById('heading').innerText = topicName || 'PS'

      const savedIndex = getFromLocalStorage('currentQuestionIndex')
      if (savedIndex !== undefined && savedIndex !== null && savedIndex < count) {
        i = savedIndex
      }

      loadButtons()
      loadQuestion(i)

      const topics = JSON.parse(localStorage.getItem('topics')) || []
      if (!topics.find(t => t.heading === topicName)) {
        topics.push(selectedTopic)
        saveToLocalStorage('topics', topics)
      }
    } else {
      document.getElementById('heading').innerText = 'Topic not found'
      document.getElementById('buttonContainer').innerHTML = 'No questions available for this topic.'
    }
  })

// ─── Question buttons ─────────────────────────────────────────────────────────
function loadButtons() {
  var buttonContainer = document.getElementById('buttonContainer')
  buttonContainer.innerHTML = ''
  for (var j = 0; j < questions.length; j++) {
    var btn = document.createElement('button')
    btn.className = 'btnButton btn smallbtn'
    btn.innerHTML = 'Q' + (j + 1)
    btn.setAttribute('onclick', 'abc(' + (j + 1) + ')')
    if (getFromLocalStorage(topicName + '_completed')) {
      btn.classList.add('disabled-btn')
      btn.disabled = true
    }
    buttonContainer.appendChild(btn)
  }
  updateButtonStyles()
}

// ─── NEW: render a fraction numerator/denominator which may be array (nested) ─
function renderFractionPart(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'string') return item
      if (item.fraction) return renderFractionPartHTML(item.fraction)
      if (item.root) return renderRoot(item.root)
      return ''
    }).join('')
  }
  return String(value)
}

function renderFractionPartHTML(fractionObj) {
  const { whole, numerator, denominator } = fractionObj
  const numHTML = renderFractionPart(numerator)
  const denHTML = renderFractionPart(denominator)
  let html = '<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 3px;font-size:0.85em;">'
  if (whole !== undefined && whole !== '') {
    html = `<span style="display:inline-flex;align-items:center;vertical-align:middle;gap:2px;">
      <span>${whole}</span>` + html
  }
  html += `<span style="display:inline-flex;align-items:center;justify-content:center;padding:0 4px;white-space:nowrap;">${numHTML}</span>
    <span style="width:100%;min-width:100%;border-top:2px solid #111;display:block;"></span>
    <span style="display:inline-flex;align-items:center;justify-content:center;padding:0 4px;white-space:nowrap;">${denHTML}</span>
  </span>`
  if (whole !== undefined && whole !== '') {
    html += '</span>'
  }
  return html
}

// ─── NEW: renderRoot ──────────────────────────────────────────────────────────
function renderRoot(rootObj) {
  const { index, value, coeff, inputId } = rootObj

  if (value !== undefined && !inputId) {
    const coeffHTML = coeff ? `<span style="font-weight:bold;">${coeff}</span>` : ''
    const indexHTML = (index && index !== 2)
      ? `<span style="font-size:0.8em;font-weight:bold;color:#1a2a4a;position:relative;top:-12px;margin-right:-2px;">${index}</span>`
      : ''
    return `<span style="display:inline-flex;align-items:flex-end;vertical-align:middle;margin:0 4px;">
      ${coeffHTML}
      <span class="sqrt-wrapper">
        ${indexHTML}
        <span class="sqrt-radical">√</span>
        <span class="sqrt-content">
          <span class="sqrt-fixed-text">${value}</span>
        </span>
      </span>
    </span>`
  }

  if (inputId) {
    let indexHTML = ''
    if (rootObj.indexInputId) {
      indexHTML = `<input type="text" id="${rootObj.indexInputId}" class="answer-input" autocomplete="off"
        style="width:28px;height:24px;font-size:0.75em;border:2px solid #1a2a4a;border-radius:4px;
        position:relative;top:-10px;margin-right:-3px;z-index:1;text-align:center;
        background:white;outline:none;padding:0;"/>`
    } else if (rootObj.index && rootObj.index !== 2) {
      indexHTML = `<span style="font-size:0.8em;font-weight:bold;color:#1a2a4a;position:relative;top:-12px;margin-right:-2px;">${rootObj.index}</span>`
    }
    return `<span class="sqrt-wrapper" style="align-items:flex-end;">
      ${indexHTML}
      <span class="sqrt-radical">√</span>
      <span class="sqrt-content">
        <input type="text" id="${inputId}" class="answer-input" autocomplete="off" style="width:80px;height:36px;text-align:center;" />
      </span>
    </span>`
  }

  return ''
}

// ─── NEW: renderPowerFrac ─────────────────────────────────────────────────────
function renderPowerFrac(pfObj) {
  const { baseInputId, numInputId, denInputId, fixedBase, fixedNum, fixedDen } = pfObj

  const numHTML = fixedNum
    ? `<span style="font-size:1em;font-weight:bold;">${fixedNum}</span>`
    : `<input type="text" id="${numInputId}" class="answer-input" autocomplete="off"
        style="width:30px;height:22px;font-size:0.8em;padding:0;margin:0;border:2px solid #ccc;border-radius:4px;text-align:center;background:white;outline:none;"/>`

  const denHTML = fixedDen
    ? `<span style="font-size:1em;font-weight:bold;">${fixedDen}</span>`
    : `<input type="text" id="${denInputId}" class="answer-input" autocomplete="off"
        style="width:30px;height:22px;font-size:0.8em;padding:0;margin:0;border:2px solid #ccc;border-radius:4px;text-align:center;background:white;outline:none;"/>`

  const baseHTML = fixedBase
    ? `<span style="font-size:1.1em;font-weight:bold;">${fixedBase}</span>`
    : `<input type="text" id="${baseInputId}" class="answer-input" autocomplete="off"
        style="width:55px;height:45px;font-size:1.1em;border:2px solid #ccc;border-radius:8px;text-align:center;background:white;outline:none;"/>`

  return `<span style="display:inline-flex;align-items:flex-start;vertical-align:middle;">
    ${baseHTML}
    <span style="display:inline-flex;flex-direction:column;align-items:center;
      font-size:0.5em;margin-left:3px;margin-top:-20px;gap:0px;line-height:1.2;">
      ${numHTML}
      <span style="width:100%;min-width:28px;height:1.5px;background:#444;display:block;margin:1px 0;"></span>
      ${denHTML}
    </span>
  </span>`
}

// ─── Render fraction in question text ────────────────────────────────────────
function renderQuestionText(questionParts, questionElement) {
  questionElement.innerHTML = ''
  questionParts.forEach(part => {
    if (typeof part === 'string') {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = part
      if (part.includes('<') && part.includes('>')) {
        while (tempDiv.firstChild) questionElement.appendChild(tempDiv.firstChild)
      } else {
        questionElement.appendChild(document.createTextNode(part))
      }
    } else if (part.fraction) {
      const { whole, numerator, denominator } = part.fraction
      const span = document.createElement('span')
      span.className = 'mixed-fraction'
      if (whole !== undefined && whole !== '') {
        span.innerHTML = `
          <span class="whole">${whole}</span>
          <span class="fraction">
            <span class="numerator">${numerator}</span>
            <span class="denominator">${denominator}</span>
          </span>`
      } else {
        span.innerHTML = `
          <span class="whole">&nbsp;</span>
          <span class="fraction">
            <span class="numerator">${numerator}</span>
            <span class="denominator">${denominator}</span>
          </span>`
      }
      questionElement.appendChild(span)
    // NEW: root and powerFrac support in question text
    } else if (part.root) {
      const span = document.createElement('span')
      span.innerHTML = renderRoot(part.root)
      questionElement.appendChild(span)
    } else if (part.powerFrac) {
      const span = document.createElement('span')
      span.innerHTML = renderPowerFrac(part.powerFrac)
      questionElement.appendChild(span)
    }
  })
}

// ─── Main question loader ─────────────────────────────────────────────────────
function loadQuestion(index) {
  var randomQuestion = questions[index]
  if (!randomQuestion) { console.error('No question found at index:', index); return }

  var questionElement = document.getElementById('question')
  var optionsElement  = document.getElementById('options')
  optionsElement.innerHTML = ''

  // Show question image
  var picDiv = document.getElementById('picdiv')
  picDiv.innerHTML = ''
  if (randomQuestion.image) {
    document.querySelector('.question-image-area').style.display = 'block'
    picDiv.style.display = 'flex'
    document.querySelector('.question-content').style.display = 'flex'
    var img = document.createElement('img')
    img.src = randomQuestion.image
    img.alt = 'Question Image'
    img.style.cssText = 'max-width:100%;max-height:300px;object-fit:contain;border-radius:8px;'
    picDiv.appendChild(img)
  } else {
    picDiv.style.display = 'none'
    document.querySelector('.question-image-area').style.display = 'none'
    document.querySelector('.question-content').style.display = 'block'
  }

  // ── DIAGRAM question ──────────────────────────────────────────────────────
  if (randomQuestion.diagram) {
    if (Array.isArray(randomQuestion.question)) {
      renderQuestionText(randomQuestion.question, questionElement)
    } else {
      questionElement.innerHTML = randomQuestion.question
    }
    loadDiagramQuestion(randomQuestion, optionsElement, index)

  // ── INPUT question ────────────────────────────────────────────────────────
  } else if (randomQuestion.input && Array.isArray(randomQuestion.input)) {
    questionElement.innerHTML = ''
    loadInputQuestion(randomQuestion, optionsElement, index)

  // ── DROPDOWN question (NEW) ───────────────────────────────────────────────
  } else if (randomQuestion.dropdown && Array.isArray(randomQuestion.dropdown)) {
    questionElement.innerHTML = ''
    loadDropdownQuestion(randomQuestion, optionsElement, index)

  // ── MCQ question ──────────────────────────────────────────────────────────
  } else {
    if (Array.isArray(randomQuestion.question)) {
      renderQuestionText(randomQuestion.question, questionElement)
    } else {
      questionElement.innerHTML = randomQuestion.question
    }
    loadOptionQuestion(randomQuestion, optionsElement, index)
  }

  updateButtonVisibility()
  updateButtonStyles()
  updateButtonText()
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DIAGRAM QUESTION
// ═══════════════════════════════════════════════════════════════════════════════

function buildDiagramHTML(d) {
  const op  = d.op || '×'
  const aid = d.arrowId
  let slotIdx = 0
  const slots = d.slots || []

  function slot(value, id, tx, ty, anchor, fontSize, rx, ry, rw, rh, iw, ih) {
    if (value !== '') {
      return `<text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="${fontSize}" font-weight="bold" fill="#111">${value}</text>`
    } else {
      const sid = slots[slotIdx++] || id
      return `
      <rect id="rect-${sid}" x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="8" ry="8" fill="white" stroke="#444" stroke-width="3"/>
      <foreignObject x="${rx}" y="${ry}" width="${rw}" height="${rh}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${rw}px;height:${rh}px;display:flex;align-items:center;justify-content:center;">
          <input type="text" id="${sid}" class="diagram-input answer-input" autocomplete="off"
            style="width:${iw}px;height:${ih}px;border:none;outline:none;font-size:${fontSize}px;font-weight:bold;text-align:center;background:transparent;"/>
        </div>
      </foreignObject>`
    }
  }

  function labelSlot(value, fallbackId, tx, ty, anchor, rx, ry) {
    if (value !== '') {
      return `<text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="20" font-weight="bold" fill="#222">${op} ${value}</text>`
    } else {
      const sid = slots[slotIdx++] || fallbackId
      return `
      <text x="202" y="${ty}" text-anchor="end" font-size="22" font-weight="bold" fill="#222">${op}</text>
      <rect id="rect-${sid}" x="207" y="${ry}" width="65" height="42" rx="7" ry="7" fill="white" stroke="#444" stroke-width="3"/>
      <foreignObject x="207" y="${ry}" width="65" height="42">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:65px;height:42px;display:flex;align-items:center;justify-content:center;">
          <input type="text" id="${sid}" class="diagram-input answer-input" autocomplete="off"
            style="width:55px;height:34px;border:none;outline:none;font-size:22px;font-weight:bold;text-align:center;background:transparent;"/>
        </div>
      </foreignObject>`
    }
  }

  const fracNumSVG = slot(d.fracNum, 'fn',  58,  85, 'middle', 62,  12,  38, 80, 60, 70, 48)
  const fracDenSVG = slot(d.fracDen, 'fd',  58, 170, 'middle', 62,  12, 125, 80, 60, 70, 48)
  const topSVG     = labelSlot(d.topLabel, 'tl', 245,  22, 'middle', 180,   2)
  const botSVG     = labelSlot(d.botLabel, 'bl', 245, 218, 'middle', 180, 198)
  const resNumSVG  = slot(d.resNum,  'rn', 432,  85, 'middle', 62, 390,  38, 80, 60, 70, 48)
  const resDenSVG  = slot(d.resDen,  'rd', 432, 170, 'middle', 62, 390, 116, 80, 60, 70, 48)

  return `
  <div style="display:flex;justify-content:center;align-items:center;">
    <svg width="520" height="230" viewBox="0 0 520 230" style="overflow:visible;max-width:100%;">
      <defs>
        <marker id="atop-${aid}" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L10,3.5 z" fill="#333"/>
        </marker>
        <marker id="abot-${aid}" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L10,3.5 z" fill="#333"/>
        </marker>
      </defs>
      ${fracNumSVG}
      <line x1="12" y1="103" x2="104" y2="103" stroke="#111" stroke-width="5"/>
      ${fracDenSVG}
      <text x="245" y="128" text-anchor="middle" font-size="52" font-weight="bold" fill="#222">=</text>
      ${topSVG}
      <path d="M 108 78 Q 255 28 388 78" stroke="#333" stroke-width="2.8" fill="none" marker-end="url(#atop-${aid})"/>
      <path d="M 108 155 Q 255 205 388 155" stroke="#333" stroke-width="2.8" fill="none" marker-end="url(#abot-${aid})"/>
      ${botSVG}
      ${resNumSVG}
      <line x1="390" y1="108" x2="475" y2="108" stroke="#444" stroke-width="4"/>
      ${resDenSVG}
    </svg>
  </div>`
}

function styleDiagramInput(elId, isCorrect) {
  const color = isCorrect ? '#4CAF50' : '#f44336'
  const bg    = isCorrect ? '#d4edda' : '#f8d7da'
  const txt   = isCorrect ? '#155724' : '#721c24'
  const el = document.getElementById(elId)
  if (!el) return
  el.style.background = bg
  el.style.color = txt
  const fo = el.closest('foreignObject')
  if (fo) {
    let prev = fo.previousElementSibling
    while (prev) {
      if (prev.tagName.toLowerCase() === 'rect') {
        prev.setAttribute('stroke', color)
        prev.setAttribute('fill', bg)
        break
      }
      prev = prev.previousElementSibling
    }
  } else {
    el.style.borderColor = color
  }
}

function loadDiagramQuestion(randomQuestion, optionsElement, index) {
  optionsElement.style.display    = 'flex'
  optionsElement.style.flexDirection = 'column'
  optionsElement.style.alignItems = 'center'
  optionsElement.classList.add('input-question')

  const d = randomQuestion.diagram

  const diagramWrapper = document.createElement('div')
  diagramWrapper.className = 'diagram-wrapper'
  diagramWrapper.innerHTML = buildDiagramHTML(d)
  optionsElement.appendChild(diagramWrapper)

  if (randomQuestion.hcf && randomQuestion.hcfId) {
    const hcfDiv = document.createElement('div')
    hcfDiv.style.cssText = 'display:flex;align-items:center;gap:12px;margin-top:18px;font-size:1.6em;font-weight:900;'

    if (randomQuestion.hcfFixed) {
      hcfDiv.innerHTML = `<span style="font-style:italic;font-weight:900;">HCF =</span>
        <span style="font-weight:900;">${randomQuestion.hcfFixed}</span>`
    } else {
      hcfDiv.innerHTML = `
        <span style="font-style:italic;font-weight:900;">HCF =</span>
        <input type="text" id="${randomQuestion.hcfId}" class="answer-input"
          style="width:65px;height:55px;border:3px solid #444;border-radius:8px;font-size:1em;font-weight:bold;text-align:center;outline:none;"
          autocomplete="off"/>`
    }
    optionsElement.appendChild(hcfDiv)
  }

  optionsElement.querySelectorAll('.answer-input').forEach(input => {
    input.addEventListener('input', handleInputAnswerChange)
    input.addEventListener('keyup', e => { if (e.key === 'Enter') checkAnswer() })
  })

  const prev = Ansgiven[index]
  if (prev && Array.isArray(prev)) {
    const allInputs = optionsElement.querySelectorAll('.answer-input')
    allInputs.forEach((input, idx) => {
      if (prev[idx] !== undefined) input.value = prev[idx]
    })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  INPUT QUESTION  (existing, with root/powerFrac support added)
// ═══════════════════════════════════════════════════════════════════════════════
function loadInputQuestion(randomQuestion, optionsElement, index) {
  optionsElement.innerHTML = ''
  optionsElement.style.display = 'flex'
  optionsElement.style.flexDirection = 'column'
  optionsElement.style.alignItems = 'center'
  optionsElement.classList.add('input-question')

  var questionContainer = document.createElement('div')
  questionContainer.className = 'question-container'
  questionContainer.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:5px;font-size:1.5em;text-align:center;'

  let inputIndex = 0

  if (Array.isArray(randomQuestion.question)) {
    randomQuestion.question.forEach(part => {
      if (typeof part === 'string') {
        let stringParts = part.split('______')
        stringParts.forEach((stringPart, idx) => {
          if (stringPart) {
            if (stringPart.includes('<br>')) {
              let brParts = stringPart.split('<br>')
              brParts.forEach((brPart, brIdx) => {
                if (brPart.trim()) {
                  let span = document.createElement('span')
                  span.innerHTML = brPart
                  questionContainer.appendChild(span)
                }
                if (brIdx < brParts.length - 1) {
                  questionContainer.appendChild(document.createElement('br'))
                  let lb = document.createElement('div')
                  lb.style.cssText = 'flex-basis:100%;height:0;'
                  questionContainer.appendChild(lb)
                }
              })
            } else {
              let span = document.createElement('span')
              span.innerHTML = stringPart
              questionContainer.appendChild(span)
            }
          }
          if (idx < stringParts.length - 1 && inputIndex < randomQuestion.input.length) {
            addInputField(questionContainer, randomQuestion.input[inputIndex])
            inputIndex++
          }
        })
      } else if (part.fraction) {
        const { whole, numerator, denominator } = part.fraction
        const span = document.createElement('span')
        span.className = 'mixed-fraction'
        const wholeSpan = document.createElement('span')
        wholeSpan.className = 'whole'
        const fractionSpan = document.createElement('span')
        fractionSpan.className = 'fraction'
        const numeratorSpan = document.createElement('span')
        numeratorSpan.className = 'numerator'
        const denominatorSpan = document.createElement('span')
        denominatorSpan.className = 'denominator'

        if (whole === '______') {
          wholeSpan.innerHTML = ''
          wholeSpan.appendChild(createInputElement(randomQuestion.input[inputIndex]))
          inputIndex++
        } else {
          wholeSpan.innerHTML = whole ? whole : '&nbsp;'
        }
        if (numerator === '______') {
          numeratorSpan.appendChild(createInputElement(randomQuestion.input[inputIndex]))
          inputIndex++
        } else {
          numeratorSpan.innerHTML = renderFractionPart(numerator)
        }
        if (denominator === '______') {
          denominatorSpan.appendChild(createInputElement(randomQuestion.input[inputIndex]))
          inputIndex++
        } else {
          denominatorSpan.innerHTML = renderFractionPart(denominator)
        }

        fractionSpan.appendChild(numeratorSpan)
        fractionSpan.appendChild(denominatorSpan)
        span.appendChild(wholeSpan)
        span.appendChild(fractionSpan)
        questionContainer.appendChild(span)

      // NEW: root and powerFrac in input question parts
      } else if (part.root) {
        const span = document.createElement('span')
        span.innerHTML = renderRoot(part.root)
        questionContainer.appendChild(span)
      } else if (part.powerFrac) {
        const span = document.createElement('span')
        span.innerHTML = renderPowerFrac(part.powerFrac)
        questionContainer.appendChild(span)
      }
    })
  } else {
    let brParts = randomQuestion.question.split('<br>')
    brParts.forEach((brPart, brIdx) => {
      if (brPart.trim()) {
        let stringParts = brPart.split('______')
        stringParts.forEach((part, idx) => {
          if (part) {
            let span = document.createElement('span')
            span.innerHTML = part
            questionContainer.appendChild(span)
          }
          if (idx < stringParts.length - 1 && inputIndex < randomQuestion.input.length) {
            addInputField(questionContainer, randomQuestion.input[inputIndex])
            inputIndex++
          }
        })
      }
      if (brIdx < brParts.length - 1) {
        questionContainer.appendChild(document.createElement('br'))
        let lb = document.createElement('div')
        lb.style.cssText = 'flex-basis:100%;height:0;'
        questionContainer.appendChild(lb)
      }
    })
  }

  optionsElement.appendChild(questionContainer)

  // Attach listeners to ALL inputs including root/powerFrac rendered via innerHTML
  questionContainer.querySelectorAll('.answer-input').forEach(input => {
    input.addEventListener('input', handleInputAnswerChange)
    input.addEventListener('keyup', e => { if (e.key === 'Enter') checkAnswer() })
  })

  // Restore previous answers
  var prev = Ansgiven[index]
  if (prev && Array.isArray(prev)) {
    let inputs = questionContainer.querySelectorAll('.answer-input')
    inputs.forEach((input, idx) => {
      if (prev[idx] !== undefined) input.value = prev[idx]
    })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DROPDOWN QUESTION (NEW)
// ═══════════════════════════════════════════════════════════════════════════════
function loadDropdownQuestion(randomQuestion, optionsElement, index) {
  optionsElement.innerHTML = ''
  optionsElement.style.display = 'flex'
  optionsElement.style.flexDirection = 'column'
  optionsElement.style.alignItems = 'center'
  optionsElement.classList.add('input-question')

  var questionContainer = document.createElement('div')
  questionContainer.className = 'question-container'
  questionContainer.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:5px;font-size:1.5em;text-align:center;'

  let dropdownIndex = 0

  if (Array.isArray(randomQuestion.question)) {
    randomQuestion.question.forEach(part => {
      if (typeof part === 'string') {
        let ddParts = part.split('___dropdown___')
        ddParts.forEach((ddPart, idx) => {
          if (ddPart) {
            if (ddPart.includes('<br>')) {
              ddPart.split('<br>').forEach((brPart, brIdx, arr) => {
                if (brPart.trim()) {
                  let span = document.createElement('span')
                  span.innerHTML = brPart
                  questionContainer.appendChild(span)
                }
                if (brIdx < arr.length - 1) {
                  // force line break in flexbox
                  let lb = document.createElement('div')
                  lb.style.cssText = 'flex-basis:100%;height:0;'
                  questionContainer.appendChild(lb)
                }
              })
            } else {
              let span = document.createElement('span')
              span.innerHTML = ddPart
              questionContainer.appendChild(span)
            }
          }
          if (idx < ddParts.length - 1 && dropdownIndex < randomQuestion.dropdown.length) {
            const sel = document.createElement('select')
            sel.className = 'answer-input'
            sel.style.cssText = 'height:45px;font-size:0.8em;padding:5px;border-radius:6px;border:2px solid #444;text-align:center;margin:0 4px;'
            const defaultOpt = document.createElement('option')
            defaultOpt.value = ''
            defaultOpt.textContent = 'Select'
            sel.appendChild(defaultOpt)
            randomQuestion.dropdown[dropdownIndex].forEach(optVal => {
              const o = document.createElement('option')
              o.value = optVal
              o.textContent = optVal
              sel.appendChild(o)
            })
            sel.addEventListener('change', handleInputAnswerChange)
            questionContainer.appendChild(sel)
            dropdownIndex++
          }
        })
      } else if (part.fraction) {
        const { whole, numerator, denominator } = part.fraction
        const span = document.createElement('span')
        span.className = 'mixed-fraction'
        span.innerHTML = `<span class="whole">${whole || '&nbsp;'}</span>
          <span class="fraction">
            <span class="numerator">${numerator}</span>
            <span class="denominator">${denominator}</span>
          </span>`
        questionContainer.appendChild(span)
      } else if (part.root) {
        const span = document.createElement('span')
        span.innerHTML = renderRoot(part.root)
        questionContainer.appendChild(span)
      } else if (part.powerFrac) {
        const span = document.createElement('span')
        span.innerHTML = renderPowerFrac(part.powerFrac)
        questionContainer.appendChild(span)
      }
    })
  }

  optionsElement.appendChild(questionContainer)

  // Restore previous answers
  var prev = Ansgiven[index]
  if (prev && Array.isArray(prev)) {
    let inputs = questionContainer.querySelectorAll('.answer-input')
    inputs.forEach((input, idx) => {
      if (prev[idx] !== undefined) input.value = prev[idx]
    })
  }
}

function addInputField(container, inputField) {
  container.appendChild(createInputElement(inputField))
}

function createInputElement(inputField) {
  let el = document.createElement('input')
  el.type = 'text'
  el.className = 'answer-input'
  el.style.cssText = 'padding:8px;font-size:1em;border:2px solid #ccc;border-radius:6px;text-align:center;width:80px;max-width:80px;'
  el.addEventListener('input', handleInputAnswerChange)
  return el
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MCQ QUESTION  (existing, with root/array option support added)
// ═══════════════════════════════════════════════════════════════════════════════
function loadOptionQuestion(randomQuestion, optionsElement, index) {
  var hasImageOptions   = randomQuestion.options.some(o => o.image)
  var hasTextOnlyOptions = randomQuestion.options.every(o => !o.image)

  if (hasImageOptions) {
    optionsElement.style.display = 'grid'
    optionsElement.style.gridTemplateColumns = 'repeat(2, 1fr)'
    optionsElement.style.gap = '1rem'
    optionsElement.style.justifyContent = 'center'
    optionsElement.classList.remove('text-only')
  } else if (hasTextOnlyOptions) {
    optionsElement.classList.add('text-only')
    optionsElement.classList.remove('input-question')
  }

  var selectedLi = null

  randomQuestion.options.forEach(function(option, idx) {
    var li = document.createElement('li')
    li.classList.add('option-container')
    li.setAttribute('onclick', 'optionContainer()')
    li.onclick = function() {
      if (selectedLi) selectedLi.style.border = ''
      selectedLi = li
    }

    var radioButton = document.createElement('input')
    radioButton.type  = 'radio'
    radioButton.name  = 'answer'
    radioButton.value = idx
    radioButton.style.display = 'none'

    if (option.image) {
      var optionImage = document.createElement('img')
      optionImage.src   = option.image
      optionImage.alt   = 'Option Image'
      optionImage.style.cssText = 'width:100%;max-width:400px;cursor:pointer;border:3px solid black;'
      optionImage.onclick = function() {
        radioButton.checked = true
        optionsElement.querySelectorAll('img').forEach(img => img.style.border = '3px solid black')
        optionImage.style.border = '3px solid #007bff'
        handleAnswerChange()
      }
      li.appendChild(optionImage)
    } else {
      optionsElement.style.display = 'grid'
      var optionTextButton = document.createElement('button')
      optionTextButton.className = 'btnOption'

      if (option.textParts) {
        option.textParts.forEach(part => {
          if (typeof part === 'string') {
            optionTextButton.innerHTML += part
          } else if (part.fraction) {
            const { whole, numerator, denominator } = part.fraction
            optionTextButton.innerHTML += `
              <span class="mixed-fraction">
                <span class="whole">${whole || ''}</span>
                <span class="fraction">
                  <span class="numerator">${numerator}</span>
                  <span class="denominator">${denominator}</span>
                </span>
              </span>`
          }
        })
      } else if (option.fraction) {
        const { whole, numerator, denominator } = option.fraction
        optionTextButton.innerHTML = `
          <span class="mixed-fraction">
            <span class="whole">${whole || ''}</span>
            <span class="fraction">
              <span class="numerator">${numerator}</span>
              <span class="denominator">${denominator}</span>
            </span>
          </span>`
      // NEW: root object option
      } else if (option.root) {
        optionTextButton.innerHTML = renderRoot(option.root)
      // NEW: array option (mixed root + text, e.g. [root, " (cube root of 10)"])
      } else if (Array.isArray(option)) {
        optionTextButton.innerHTML = option.map(item => {
          if (typeof item === 'string') return item
          if (item.fraction) {
            const { whole, numerator, denominator } = item.fraction
            return `<span class="mixed-fraction"><span class="whole">${whole || ''}</span>
              <span class="fraction"><span class="numerator">${numerator}</span>
              <span class="denominator">${denominator}</span></span></span>`
          }
          if (item.root) return renderRoot(item.root)
          return ''
        }).join('')
      } else {
        optionTextButton.innerHTML = option.text || option
      }

      optionTextButton.onclick = function() {
        radioButton.checked = true
        document.querySelectorAll('.btnOption').forEach(btn => {
          btn.style.backgroundColor = ''
          btn.style.border = ''
        })
        optionTextButton.style.backgroundColor = '#e3f2fd'
        optionTextButton.style.border = '2px solid #007bff'
        optionTextButton.style.color = 'black'
        handleAnswerChange()
      }
      li.appendChild(optionTextButton)
    }

    li.appendChild(radioButton)
    optionsElement.appendChild(li)
  })

  // Restore previously selected answer
  var prev = Ansgiven[index]
  if (prev !== null && prev !== undefined) {
    var prevEl = optionsElement.querySelector('input[name="answer"][value="' + prev + '"]')
    if (prevEl) {
      prevEl.checked = true
      var prevLi = prevEl.closest('li')
      if (prevLi) {
        var textBtn = prevLi.querySelector('.btnOption')
        if (textBtn) {
          textBtn.style.backgroundColor = '#e3f2fd'
          textBtn.style.border = '2px solid #007bff'
          textBtn.style.color = 'black'
        }
        var img = prevLi.querySelector('img')
        if (img) {
          optionsElement.querySelectorAll('img').forEach(im => im.style.border = '3px solid black')
          img.style.border = '3px solid #007bff'
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ANSWER HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

function handleInputAnswerChange() {
  saveCurrentAnswer()
  document.getElementById('subbtn').style.display = 'inline-block'
  document.getElementById('nextbtn').style.display = 'none'
}

function handleAnswerChange() {
  saveCurrentAnswer()
  document.getElementById('subbtn').style.display = 'inline-block'
  document.getElementById('nextbtn').style.display = 'none'
}

function saveCurrentAnswer() {
  var currentQuestion = questions[i]

  // NEW: dropdown treated same as input
  if (currentQuestion.diagram ||
     (currentQuestion.input && Array.isArray(currentQuestion.input)) ||
     (currentQuestion.dropdown && Array.isArray(currentQuestion.dropdown))) {
    var inputs = document.querySelectorAll('.answer-input')
    var inputAnswers = []
    var hasAnswer = false
    inputs.forEach(function(input) {
      var value = input.value.trim()
      inputAnswers.push(value)
      if (value !== '') hasAnswer = true
    })
    Ansgiven[i] = hasAnswer ? inputAnswers : null
  } else {
    var selectedAnswer = document.querySelector('input[name="answer"]:checked')
    Ansgiven[i] = selectedAnswer ? parseInt(selectedAnswer.value) : null
  }

  saveToLocalStorage('Ansgiven', Ansgiven)
}

function checkAnswer() {
  submitSound.play()
  saveCurrentAnswer()
  saveToLocalStorage('currentQuestionIndex', i)
  document.getElementById('subbtn').style.display = 'none'
  document.getElementById('nextbtn').style.display = 'inline-block'
  updateButtonStyles()
}

function newques() {
  saveCurrentAnswer()
  saveToLocalStorage('currentQuestionIndex', i + 1)

  if (i === count - 1) {
    document.getElementById('questiondiv').style.textAlign = 'center'
    displayResults()
    document.getElementById('buttonContainer').style.display = 'none'
    saveToLocalStorage('currentQuestionIndex', null)
  } else {
    i++
    loadQuestion(i)
    var r = document.getElementById('result'); if(r) r.innerHTML = ''
    document.getElementById('subbtn').style.display = 'inline-block'
    document.getElementById('nextbtn').style.display = 'none'
    updateButtonVisibility()
    updateButtonStyles()
  }
}

function abc(x) {
  saveCurrentAnswer()
  i = x - 1
  saveToLocalStorage('currentQuestionIndex', i)
  loadQuestion(i)
  var r = document.getElementById('result'); if(r) r.innerHTML = ''
  document.getElementById('subbtn').style.display = 'inline-block'
  document.getElementById('nextbtn').style.display = 'none'
  updateButtonStyles()
}

function updateButtonVisibility() {
  var currentQuestion = questions[i]
  var hasAnswer = false

  // NEW: dropdown included
  if (currentQuestion.diagram ||
     (currentQuestion.input && Array.isArray(currentQuestion.input)) ||
     (currentQuestion.dropdown && Array.isArray(currentQuestion.dropdown))) {
    document.querySelectorAll('.answer-input').forEach(function(input) {
      if (input.value.trim() !== '') hasAnswer = true
    })
  } else {
    hasAnswer = document.querySelector('input[name="answer"]:checked') !== null
  }

  document.getElementById('subbtn').style.display = hasAnswer ? 'inline-block' : 'none'
  document.getElementById('nextbtn').style.display = 'none'
}

function updateButtonStyles() {
  var buttonContainer = document.getElementById('buttonContainer')
  if (!buttonContainer) return
  var buttons = buttonContainer.getElementsByTagName('button')

  for (var j = 0; j < buttons.length; j++) {
    buttons[j].classList.remove('answered-btn', 'current-btn', 'unanswered-btn')
  }

  for (var j = 0; j < buttons.length; j++) {
    var answer = Ansgiven[j]
    var hasValidAnswer = Array.isArray(answer)
      ? answer.some(val => val && val.trim() !== '')
      : (answer !== null && answer !== undefined)

    if (j !== i) {
      buttons[j].classList.add(hasValidAnswer ? 'answered-btn' : 'unanswered-btn')
    }
  }
}

function updateButtonText() {
  var nextButton = document.getElementById('nextbtn')
  if (i === count - 1) {
    nextButton.innerHTML = 'FINISH TEST'
    nextButton.onclick = function() { newques() }
  } else {
    nextButton.innerHTML = 'Next'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b) }

function buildRationalSet(answers, question) {
  var rationals = []
  var index = 0
  question.question.forEach(function(part) {
    if (part.fraction) {
      var whole = part.fraction.whole === '______' ? parseInt(answers[index++]) : parseInt(part.fraction.whole || 0)
      var num   = part.fraction.numerator   === '______' ? parseInt(answers[index++]) : parseInt(part.fraction.numerator)
      var den   = part.fraction.denominator === '______' ? parseInt(answers[index++]) : parseInt(part.fraction.denominator)
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        var improper = whole * den + num
        var g = gcd(improper, den)
        rationals.push((improper / g) + '/' + (den / g))
      }
    }
  })
  return rationals.sort()
}

function buildDisplayString(answers, question) {
  var slots = []
  if (Array.isArray(question.question)) {
    question.question.forEach(function(part) {
      if (typeof part === 'string') {
        var matches = part.match(/______/g)
        if (matches) matches.forEach(() => slots.push({ type: 'whole' }))
      } else if (part.fraction) {
        slots.push({
          type: 'mixedFraction',
          wholeBlank: part.fraction.whole === '______',
          numBlank:   part.fraction.numerator === '______',
          denBlank:   part.fraction.denominator === '______',
          whole: part.fraction.whole,
          num:   part.fraction.numerator,
          den:   part.fraction.denominator
        })
      }
    })
  }

  var parts = []
  var answerIndex = 0
  slots.forEach(function(slot) {
    if (slot.type === 'mixedFraction') {
      var whole = slot.wholeBlank ? answers[answerIndex++] : slot.whole
      var num   = slot.numBlank   ? answers[answerIndex++] : slot.num
      var den   = slot.denBlank   ? answers[answerIndex++] : slot.den
      parts.push(`
        <span class="display-fraction">
          ${whole ? `<span class="whole-part">${whole}</span>` : ''}
          <span class="fraction-part">
            <span class="numerator">${num}</span>
            <span class="denominator">${den}</span>
          </span>
        </span>`)
    } else {
      parts.push(`<span>${answers[answerIndex]}</span>`)
      answerIndex++
    }
  })
  return parts.join(' , ')
}

function formatTextPartsForDisplay(textParts) {
  return textParts.map(function(part) {
    if (typeof part === 'string') return part
    if (part.fraction) {
      const { whole, numerator, denominator } = part.fraction
      return `<span class="display-fraction"><span class="fraction-part"><span class="numerator">${numerator}</span><span class="denominator">${denominator}</span></span></span>`
    }
    return ''
  }).join('')
}

function formatFractionForDisplay(option) {
  if (option && option.fraction) {
    const { whole, numerator, denominator } = option.fraction
    let html = '<span class="display-fraction">'
    if (whole !== undefined && whole !== '' && whole !== null) {
      html += `<span class="whole-part">${whole}</span><span class="fraction-part"><span class="numerator">${numerator}</span><span class="denominator">${denominator}</span></span>`
    } else {
      html += `<span class="fraction-part"><span class="numerator">${numerator}</span><span class="denominator">${denominator}</span></span>`
    }
    html += '</span>'
    return html
  }
  return option.text || option
}

function checkDiagramAnswer(givenAnswers, question) {
  const d = question.diagram
  const slots = d.slots || []
  const correct = question.answer || []

  var allCorrect = slots.every((id, idx) => {
    return givenAnswers[idx] && givenAnswers[idx].trim().toLowerCase() === correct[idx].trim().toLowerCase()
  })

  if (question.hcf && question.hcfId && !question.hcfFixed && correct[slots.length] !== undefined) {
    var hcfIdx = slots.length
    allCorrect = allCorrect && givenAnswers[hcfIdx] &&
      givenAnswers[hcfIdx].trim().toLowerCase() === correct[hcfIdx].trim().toLowerCase()
  }

  return allCorrect
}

function buildDiagramDisplayString(answers, question) {
  const d = question.diagram
  const slots = d.slots || []
  var parts = slots.map((id, idx) => {
    var val = answers[idx] || '?'
    return `<span>${val}</span>`
  })
  if (question.hcf && question.hcfId && answers[slots.length] !== undefined) {
    parts.push(`<span>HCF: ${answers[slots.length]}</span>`)
  }
  return parts.join(' , ')
}

function buildDiagramSVGForResult(question, answers, correctAnswers, showColors) {
  const d = question.diagram
  const op  = d.op || '×'
  const aid = d.arrowId + '_result_' + Math.random().toString(36).slice(2, 7)
  const slots = d.slots || []
  let slotIdx = 0

  function resolveSlot(diagramValue) {
    if (diagramValue !== '') return { val: diagramValue, fixed: true }
    const idx = slotIdx++
    const val = (answers && answers[idx] !== undefined) ? answers[idx] : '?'
    const correct = (correctAnswers && correctAnswers[idx] !== undefined) ? correctAnswers[idx] : val
    const isRight = val.trim().toLowerCase() === correct.trim().toLowerCase()
    return { val, fixed: false, color: showColors ? (isRight ? '#4CAF50' : '#f44336') : '#111', bg: showColors ? (isRight ? '#d4edda' : '#f8d7da') : 'white' }
  }

  function textSlot(diagramValue, tx, ty, anchor, fontSize) {
    const r = resolveSlot(diagramValue)
    const col = r.fixed ? '#111' : r.color
    return `<text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="${fontSize}" font-weight="bold" fill="${col}">${r.val}</text>`
  }

  function labelSlotStatic(diagramValue, ty) {
    if (diagramValue !== '') {
      return `<text x="245" y="${ty}" text-anchor="middle" font-size="20" font-weight="bold" fill="#222">${op} ${diagramValue}</text>`
    } else {
      const idx = slotIdx++
      const val     = (answers       && answers[idx]       !== undefined) ? answers[idx]       : '?'
      const correct = (correctAnswers && correctAnswers[idx] !== undefined) ? correctAnswers[idx] : val
      const isRight = val.trim().toLowerCase() === correct.trim().toLowerCase()
      const col = showColors ? (isRight ? '#4CAF50' : '#f44336') : '#111'
      return `<text x="202" y="${ty}" text-anchor="end" font-size="22" font-weight="bold" fill="#222">${op}</text>
              <text x="275" y="${ty}" text-anchor="middle" font-size="22" font-weight="bold" fill="${col}">${val}</text>`
    }
  }

  const fracNumSVG = textSlot(d.fracNum,  58,  85, 'middle', 62)
  const fracDenSVG = textSlot(d.fracDen,  58, 170, 'middle', 62)
  const topSVG     = labelSlotStatic(d.topLabel,  22)
  const botSVG     = labelSlotStatic(d.botLabel, 218)
  const resNumSVG  = textSlot(d.resNum,  432,  85, 'middle', 62)
  const resDenSVG  = textSlot(d.resDen,  432, 170, 'middle', 62)

  let hcfHTML = ''
  if (question.hcf && question.hcfId) {
    const hcfIdx = slots.length
    const hcfVal = (answers && answers[hcfIdx] !== undefined) ? answers[hcfIdx] : '?'
    const hcfCorrect = (correctAnswers && correctAnswers[hcfIdx] !== undefined) ? correctAnswers[hcfIdx] : hcfVal
    const hcfRight = hcfVal.trim().toLowerCase() === hcfCorrect.trim().toLowerCase()
    const hcfCol = showColors ? (hcfRight ? '#4CAF50' : '#f44336') : '#111'
    hcfHTML = `<div style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:1.1em;font-weight:bold;">
      <span style="font-style:italic;">HCF =</span>
      <span style="color:${hcfCol};font-weight:bold;">${hcfVal}</span>
    </div>`
  }

  return `
  <div style="display:flex;flex-direction:column;align-items:center;">
    <svg width="520" height="230" viewBox="0 0 520 230" style="overflow:visible;max-width:100%;">
      <defs>
        <marker id="atop-${aid}" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L10,3.5 z" fill="#333"/>
        </marker>
        <marker id="abot-${aid}" markerWidth="10" markerHeight="10" refX="9" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L10,3.5 z" fill="#333"/>
        </marker>
      </defs>
      ${fracNumSVG}
      <line x1="12" y1="103" x2="104" y2="103" stroke="#111" stroke-width="5"/>
      ${fracDenSVG}
      <text x="245" y="128" text-anchor="middle" font-size="52" font-weight="bold" fill="#222">=</text>
      ${topSVG}
      <path d="M 108 78 Q 255 28 388 78" stroke="#333" stroke-width="2.8" fill="none" marker-end="url(#atop-${aid})"/>
      <path d="M 108 155 Q 255 205 388 155" stroke="#333" stroke-width="2.8" fill="none" marker-end="url(#abot-${aid})"/>
      ${botSVG}
      ${resNumSVG}
      <line x1="390" y1="108" x2="475" y2="108" stroke="#444" stroke-width="4"/>
      ${resDenSVG}
    </svg>
    ${hcfHTML}
  </div>`
}

function displayResults() {
  score = Ansgiven.reduce((total, answer, index) => {
    var q = questions[index]
    var isCorrect = false

    if (q.diagram) {
      if (answer && Array.isArray(answer)) {
        isCorrect = checkDiagramAnswer(answer, q)
      }
    } else if (q.input && Array.isArray(q.input)) {
      if (answer && Array.isArray(answer) && Array.isArray(q.answer)) {
        if (q.unorderedFractions) {
          var studentSet = buildRationalSet(answer, q)
          var correctSet = buildRationalSet(q.answer, q)
          isCorrect = JSON.stringify(studentSet) === JSON.stringify(correctSet)
        } else if (q.unorderedIndices && q.unorderedIndices.length) {
          // NEW: unorderedIndices
          const unordered = q.unorderedIndices
          let orderedOK = q.answer.every((ca, idx) => {
            if (unordered.includes(idx)) return true
            return answer[idx] && answer[idx].toLowerCase().trim() === ca.toLowerCase().trim()
          })
          const userVals = unordered.map(idx => (answer[idx] || '').toLowerCase().trim()).sort()
          const correctVals = unordered.map(idx => q.answer[idx].toLowerCase().trim()).sort()
          isCorrect = orderedOK && JSON.stringify(userVals) === JSON.stringify(correctVals)
        } else {
          isCorrect = q.answer.every((correctAnswer, idx) =>
            answer[idx] && answer[idx].toLowerCase().trim() === correctAnswer.toLowerCase().trim()
          )
        }
      }
    } else if (q.dropdown && Array.isArray(q.dropdown)) {
      // NEW: dropdown scoring
      if (answer && Array.isArray(answer) && Array.isArray(q.correct)) {
        const unordered = q.unorderedIndices || []
        let orderedOK = q.correct.every((ca, idx) => {
          if (unordered.includes(idx)) return true
          return answer[idx] && answer[idx].toLowerCase().trim() === ca.toLowerCase().trim()
        })
        let unorderedOK = true
        if (unordered.length) {
          const userVals = unordered.map(idx => (answer[idx] || '').toLowerCase().trim()).sort()
          const correctVals = unordered.map(idx => q.correct[idx].toLowerCase().trim()).sort()
          unorderedOK = JSON.stringify(userVals) === JSON.stringify(correctVals)
        }
        isCorrect = orderedOK && unorderedOK
      }
    } else {
      isCorrect = answer === q.answer
    }

    return isCorrect ? total + 1 : total
  }, 0)

  saveToLocalStorage(topicName + '_score', score)
  saveToLocalStorage(topicName + '_completed', 'true')

  var home = "<a href='./graph.html'><b class='btn btn-success next-btn-progress'>Click here to View Report</b></a><br>"
  saveToLocalStorage(topicName + '_results_content', home)

  var questionsPerPage = 5
  var numberOfPages = Math.ceil(questions.length / questionsPerPage)
  var questionContent = ''

  for (var page = 0; page < numberOfPages; page++) {
    var start = page * questionsPerPage
    var end = Math.min(start + questionsPerPage, questions.length)
    var pageDiv = "<div class='question-page' style='display:" + (page === 0 ? 'block' : 'none') + ";'><h2>Page " + (page + 1) + '</h2>'

    for (var j = start; j < end; j++) {
      var quesgroup = questions[j]

      // Question display — NEW: added root rendering
      var questionDisplay = ''
      if (Array.isArray(quesgroup.question)) {
        questionDisplay = quesgroup.question.map(part => {
          if (typeof part === 'string') return part
          if (part.fraction) return formatFractionForDisplay(part)
          if (part.root) return renderRoot(part.root)  // NEW
          return part
        }).join('')
      } else {
        questionDisplay = quesgroup.question
      }

      var questionImageContent = ''
      if (quesgroup.image) {
        questionImageContent = "<br><img src='" + quesgroup.image + "' alt='Question Image' style='max-width:250px;max-height:150px;object-fit:contain;border-radius:8px;margin:10px 0;'><br>"
      }

      var ansContent  = ''
      var givenContent = ''

      if (quesgroup.diagram) {
        var correctAnswers = quesgroup.answer || []
        ansContent = buildDiagramSVGForResult(quesgroup, correctAnswers, correctAnswers, false)
        var givenAnswers = Ansgiven[j]
        if (givenAnswers && Array.isArray(givenAnswers)) {
          givenContent = buildDiagramSVGForResult(quesgroup, givenAnswers, correctAnswers, true)
        } else {
          givenContent = "<span style='color:red'>Not Answered</span>"
        }

      } else if (quesgroup.input && Array.isArray(quesgroup.input)) {
  var correctAnswers = quesgroup.answer || []
  // ← CHANGED: render as fractions instead of plain join
  ansContent = buildInputAnswerHTML(correctAnswers, quesgroup)
  var givenAnswers = Ansgiven[j]
  if (givenAnswers && Array.isArray(givenAnswers)) {
    var isCorrect
    if (quesgroup.unorderedFractions) {
      var studentSet = buildRationalSet(givenAnswers, quesgroup)
      var correctSet = buildRationalSet(correctAnswers, quesgroup)
      isCorrect = JSON.stringify(studentSet) === JSON.stringify(correctSet)
      // ← CHANGED
      givenContent = "<span style='color:" + (isCorrect ? 'inherit' : 'red') + ";'>" + buildInputAnswerHTML(givenAnswers, quesgroup) + '</span>'
    } else if (quesgroup.unorderedIndices && quesgroup.unorderedIndices.length) {
      const unordered = quesgroup.unorderedIndices
      let orderedOK = correctAnswers.every((ca, idx) => {
        if (unordered.includes(idx)) return true
        return givenAnswers[idx] && givenAnswers[idx].toLowerCase().trim() === ca.toLowerCase().trim()
      })
      const userVals = unordered.map(idx => (givenAnswers[idx] || '').toLowerCase().trim()).sort()
      const correctVals = unordered.map(idx => correctAnswers[idx].toLowerCase().trim()).sort()
      isCorrect = orderedOK && JSON.stringify(userVals) === JSON.stringify(correctVals)
      // ← CHANGED
      givenContent = "<span style='color:" + (isCorrect ? 'inherit' : 'red') + ";'>" + buildInputAnswerHTML(givenAnswers, quesgroup) + '</span>'
    } else {
      isCorrect = correctAnswers.every((ca, idx) =>
        givenAnswers[idx] && givenAnswers[idx].toLowerCase().trim() === ca.toLowerCase().trim()
      )
      // ← CHANGED
      givenContent = "<span style='color:" + (isCorrect ? 'inherit' : 'red') + ";'>" + buildInputAnswerHTML(givenAnswers, quesgroup) + '</span>'
    }
  } else {
    givenContent = "<span style='color:red'>Not Answered</span>"
  }

      } else if (quesgroup.dropdown && Array.isArray(quesgroup.dropdown)) {
        // NEW: dropdown results display
        var correctAnswers = quesgroup.correct || []
        ansContent = correctAnswers.join(' , ')
        var givenAnswers = Ansgiven[j]
        if (givenAnswers && Array.isArray(givenAnswers)) {
          const unordered = quesgroup.unorderedIndices || []
          let orderedOK = correctAnswers.every((ca, idx) => {
            if (unordered.includes(idx)) return true
            return givenAnswers[idx] && givenAnswers[idx].toLowerCase().trim() === ca.toLowerCase().trim()
          })
          let unorderedOK = true
          if (unordered.length) {
            const userVals = unordered.map(idx => (givenAnswers[idx] || '').toLowerCase().trim()).sort()
            const correctVals = unordered.map(idx => correctAnswers[idx].toLowerCase().trim()).sort()
            unorderedOK = JSON.stringify(userVals) === JSON.stringify(correctVals)
          }
          const isCorrect = orderedOK && unorderedOK
          givenContent = "<span style='color:" + (isCorrect ? 'inherit' : 'red') + ";'>" + givenAnswers.join(' , ') + '</span>'
        } else {
          givenContent = "<span style='color:red'>Not Answered</span>"
        }

      } else {
        // MCQ — original logic
        var ans = quesgroup.options[quesgroup.answer]
        var givenAnswer = Ansgiven[j] !== undefined ? quesgroup.options[Ansgiven[j]] : null

        if (!ans) {
          ansContent = "<span style='color:red'>N/A</span>"
        } else if (ans.image) {
          ansContent = "<img src='" + ans.image + "' alt='Answer Image' style='width:180px;height:120px;'>"
        } else if (ans.root) {                          // NEW
          ansContent = renderRoot(ans.root)
        } else if (Array.isArray(ans)) {                // NEW
          ansContent = ans.map(item => typeof item === 'string' ? item : item.root ? renderRoot(item.root) : '').join('')
        } else if (ans.fraction) {
          ansContent = formatFractionForDisplay(ans)
        } else if (ans.textParts) {
          ansContent = formatTextPartsForDisplay(ans.textParts)
        } else {
          ansContent = getOptionLabel(ans)
        }

        if (givenAnswer) {
          var isCorrect = Ansgiven[j] === quesgroup.answer
          if (givenAnswer && givenAnswer.image) {
            givenContent = "<img src='" + givenAnswer.image + "' alt='Given Answer Image' style='width:180px;height:120px;" + (isCorrect ? '' : 'border:2px solid red;') + "'>"
          } else if (givenAnswer.root) {                // NEW
            givenContent = "<span style='color:" + (isCorrect ? 'inherit' : 'red') + ";'>" + renderRoot(givenAnswer.root) + '</span>'
          } else if (Array.isArray(givenAnswer)) {      // NEW
            var html = givenAnswer.map(item => typeof item === 'string' ? item : item.root ? renderRoot(item.root) : '').join('')
            givenContent = "<span style='color:" + (isCorrect ? 'inherit' : 'red') + ";'>" + html + '</span>'
          } else if (givenAnswer.fraction) {
            givenContent = "<span style='color:" + (isCorrect ? 'inherit' : 'red') + ";'>" + formatFractionForDisplay(givenAnswer) + '</span>'
          } else if (givenAnswer.textParts) {
            givenContent = "<span style='color:" + (isCorrect ? 'inherit' : 'red') + ";'>" + formatTextPartsForDisplay(givenAnswer.textParts) + '</span>'
          } else {
            givenContent = "<span style='color:" + (isCorrect ? 'inherit' : 'red') + ";'>" + getOptionLabel(givenAnswer) + '</span>'
          }
        } else {
          givenContent = "<span style='color:red'>Not Answered</span>"
        }
      }

      var num = j + 1
      pageDiv += 'Q.' + num + ' ' + questionDisplay + questionImageContent + '<br>Correct Answer: ' + ansContent + '<br>Answer Given: ' + givenContent + '<br><br>'
    }

    pageDiv += '</div>'
    questionContent += pageDiv
  }

  saveToLocalStorage(topicName + '_question_content', questionContent)

  document.getElementById('picdiv').innerHTML = ''
  document.getElementById('picdiv').style.display = 'none'
  document.getElementById('questiondiv').style.display = 'none'
  document.getElementById('nextbtn').style.textAlign = 'center'

  confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } })
  var sound = new Audio('./assests/sounds/well-done.mp3')
  sound.play()

  setTimeout(() => { window.location.href = './graph.html' }, 1500)
}

function showPage(page) {
  document.querySelectorAll('.question-page').forEach((p, index) => {
    p.style.display = index === page ? 'block' : 'none'
  })
}

function getOptionLabel(option) {
  if (option.endsWith && option.endsWith('.mp3')) {
    var label = option.split('/').pop().replace('.mp3', '')
    return label.charAt(0).toUpperCase() + label.slice(1)
  }
  return option.text || option
}

function playOptionSound(option) {
  new Audio(option).play()
}

// ─── Build fraction/plain HTML for input answers in results ──────────────────
function buildInputAnswerHTML(answers, question) {
  if (!Array.isArray(question.question)) {
    return answers.join(' , ')
  }

  let answerIndex = 0
  let html = ''

  question.question.forEach(function(part) {
    if (typeof part === 'string') {
      // count blanks in this string part
      const blanks = (part.match(/______/g) || []).length
      for (let b = 0; b < blanks; b++) {
        if (answerIndex < answers.length) {
          html += `<span style="font-weight:bold;">${answers[answerIndex++]}</span>`
          if (b < blanks - 1) html += ' , '
        }
      }
    } else if (part.fraction) {
      const f = part.fraction
      const needsWhole = f.whole === '______'
      const needsNum   = f.numerator === '______'
      const needsDen   = f.denominator === '______'

      if (!needsWhole && !needsNum && !needsDen) return // fixed fraction, skip

      const whole = needsWhole ? answers[answerIndex++] : f.whole
      const num   = needsNum   ? answers[answerIndex++] : f.numerator
      const den   = needsDen   ? answers[answerIndex++] : f.denominator

      html += `<span class="display-fraction">`
      if (whole && whole !== '' && whole !== '&nbsp;') {
        html += `<span class="whole-part">${whole}</span>`
      }
      html += `<span class="fraction-part">
        <span class="numerator">${num}</span>
        <span class="denominator">${den}</span>
      </span></span> `
    }
  })

  return html || answers.join(' , ')
}