/* eslint-disable no-empty */
// THE EYE
const theEye = document.querySelector('#theeye');
const pupil = document.querySelector('.pupil');
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
function throttle(callback, delay) {
  let lastExecution = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastExecution >= delay) {
      lastExecution = now;
      callback(...args);
    }
  };
}
function updatePupilPosition(x, y) {
  const xPercentage = `${x}%`;
  const yPercentage = `${y}%`;
  pupil.style.left = xPercentage;
  pupil.style.top = yPercentage;
  pupil.style.transform = `translate(-${xPercentage}, -${yPercentage})`;
}

if (!isSafari) {
  let mouseEnterTheEye = false;
  let mouseX = 0;
  let mouseY = 0;

  theEye.addEventListener('mouseenter', () => {
    mouseEnterTheEye = true;
    const rect = theEye.getBoundingClientRect();
    theEye.addEventListener(
      'mousemove',
      throttle((ev) => {
        const x = ((ev.clientX - rect.left) * 100) / rect.width;
        const y = ((ev.clientY - rect.top) * 100) / rect.height;
        updatePupilPosition(x, y);
      }, 10)
    );
  });

  theEye.addEventListener('mouseleave', () => {
    mouseEnterTheEye = false;
  });

  document.onmousemove = (e) => {
    if (mouseEnterTheEye === false) {
      mouseX = (e.clientX * 100) / window.innerWidth;
      mouseY = (e.clientY * 100) / window.innerHeight;
      updatePupilPosition(mouseX, mouseY);
    }
  };

  document.addEventListener('mouseleave', (e) => {
    if (
      e.clientY <= 0 ||
      e.clientX <= 0 ||
      e.clientX >= window.innerWidth ||
      e.clientY >= window.innerHeight
    ) {
      updatePupilPosition(50, 50);
    }
  });
}
// FAMOB
const processingDiv = document.querySelector('.faprocessing');
const unfundedDiv = document.querySelector('.faunfunded');
const famobCards = document.querySelector('.facards');
processingDiv.addEventListener('click', () => {
  famobCards.classList.toggle('active');
});

function updateCurrentTime() {
  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
  document.getElementById('current-time').textContent = formattedTime;
  const seconds = currentTime.getSeconds();
  const millisecondsUntilNextMinute = (60 - seconds) * 1000;
  setTimeout(updateCurrentTime, millisecondsUntilNextMinute);
}
updateCurrentTime();

const faApp = document.querySelector('#famob .app');
const invoiceFund = document.querySelector('#fundInvoice');
const fundBtn = document.querySelector('#fundInvoice button');
const unfundCounter = document.querySelector('.faunfunded header mark');
const processingCounter = document.querySelector('.faprocessing header mark');
const firstProcInvoice = document.querySelector('.faprocessing .famob-invoice');
const procInvoices = document.querySelectorAll('.faprocessing .famob-invoice');
const availableFinancingElement = document.querySelector('label span strong');
const meterFinancing = document.querySelector('#financing-limit-meter div');
const totalProcessing = document.querySelector('.faprocessing header p');
const totalUnfunded = document.querySelector('.faunfunded header p');
const faSuccessMessage = document.querySelector('.fasuccess');

fundBtn.addEventListener('click', fundInvoice);
function fundInvoice() {
  invoiceFund.classList.add('hide');
  unfundCounter.textContent = '3';
  firstProcInvoice.classList.remove('hide');
  firstProcInvoice.classList.add('fadded');
  processingCounter.textContent = '2';
  famobCards.classList.add('active');
  totalProcessing.textContent = '€ 51.941,00';
  totalUnfunded.textContent = '€ 141.542,30';
  setTimeout(approveFunding, 3000);
}

function approveFunding() {
  procInvoices.forEach((el) => {
    el.classList.add('hide');
  });
  processingCounter.textContent = '0';
  totalProcessing.textContent = '€ 0,00';
  famobCards.classList.remove('active');
  unfundedDiv.classList.add('funded');
  animateNumber();
  meterFinancing.style.width = '47%';
  faApp.classList.add('dyactive');
  faSuccessMessage.classList.add('fashow');
}

function animateNumber() {
  const targetNumber = 119.283;
  let initialNumber = parseFloat(
    availableFinancingElement.textContent.replace(/[^\d.]/g, '')
  );
  const step = (initialNumber - targetNumber) / 50;
  function updateNumber() {
    if (initialNumber > targetNumber) {
      initialNumber -= step;
      availableFinancingElement.textContent = `€ ${initialNumber.toFixed(
        3
      )},00`;
      requestAnimationFrame(updateNumber);
    }
  }
  updateNumber();
}

faSuccessMessage.addEventListener('click', undoFund);
function undoFund() {
  invoiceFund.classList.remove('hide');
  unfundCounter.textContent = '4';
  procInvoices.forEach((el) => {
    el.classList.remove('hide');
  });
  firstProcInvoice.classList.add('hide');
  firstProcInvoice.classList.remove('fadded');
  processingCounter.textContent = '1';
  famobCards.classList.remove('active');
  unfundedDiv.classList.remove('funded');
  availableFinancingElement.textContent = `€ 171.224,00`;
  totalProcessing.textContent = '€ 34.598,00';
  totalUnfunded.textContent = '€ 158.885,30';
  meterFinancing.style.width = '70%';
  faApp.classList.remove('dyactive');
  faSuccessMessage.classList.remove('fashow');
}

// MEAZ
const meaz = document.querySelector('#meaz svg');
const meazCont = document.querySelector('#meaz');

const meazClasses = [
  'm-front',
  'm-top',
  'm-right',
  'm-bottom',
  'm-left',
  'm-top',
];

const meazDelay = 500;
let currentIndex = 0;
let intervalId = null;

function updateElementClass() {
  const newClass = meazClasses[currentIndex];
  meaz.setAttribute('class', newClass);
}

function startClassChange() {
  if (!intervalId) {
    intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % meazClasses.length;
      updateElementClass();
    }, meazDelay);
  }
}

function stopClassChange() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function resetToZero() {
  if (currentIndex > 0) {
    currentIndex = (currentIndex + 1) % meazClasses.length;
    updateElementClass();
    setTimeout(resetToZero, meazDelay);
  }
}

meazCont.addEventListener('mouseenter', () => {
  startClassChange();
});

meazCont.addEventListener('mouseleave', () => {
  stopClassChange();
  resetToZero();
});

// TECA
const tecaSect = document.querySelector('#teca');
const tecaWrap = document.querySelector('.tecawrap');

tecaSect.addEventListener('mouseenter', () => {
  tecaWrap.classList.remove('tecstart');
});
tecaSect.addEventListener('mouseleave', () => {
  tecaWrap.classList.add('tecstart');
  tecaWrap.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
});

// CFF
const cffSection = document.querySelector('#cff');

const pathC = cffSection.querySelector('.cff-c');
const lengthC = pathC.getTotalLength();
pathC.style.strokeDasharray = `${lengthC} ${lengthC}`;
pathC.style.strokeDashoffset = lengthC;

const pathFOne = cffSection.querySelector('.cff-f-one');
const lengthFOne = pathFOne.getTotalLength();
pathFOne.style.strokeDasharray = `${lengthFOne} ${lengthFOne}`;
pathFOne.style.strokeDashoffset = lengthFOne;

const pathFTwo = cffSection.querySelector('.cff-f-two');
const lengthFTwo = pathFTwo.getTotalLength();
pathFTwo.style.strokeDasharray = `${lengthFTwo} ${lengthFTwo}`;
pathFTwo.style.strokeDashoffset = lengthFTwo;

cffSection.addEventListener('click', () => {
  cffSection.classList.toggle('cff-anim-active');
});

// COLORS
const colorsDiv = document.querySelector('#colors > div');
const colors = document.querySelector('#colors');

colors.addEventListener('click', () => {
  colorsDiv.classList.toggle('mixin');
});
colors.addEventListener('mouseleave', () => {
  colorsDiv.classList.remove('mixin');
});

// F-DESYS
const ftabs = document.querySelectorAll('[name="tabs"]');
const destabs = document.querySelectorAll('.destab');

ftabs.forEach((tab) => {
  tab.addEventListener('change', function () {
    destabs.forEach((destab) => {
      destab.classList.remove('active');
    });

    const selectedTabValue = this.value;
    const selectedDestab = document.querySelector(`.${selectedTabValue}`);
    selectedDestab.classList.add('active');
  });
});

// FACFI
const fltBtn = document.querySelector('.filter-btn');
const fltRow = document.querySelector('.fac-filters');
const fltAll = document.querySelectorAll('.filter-selection > div label');

fltBtn.addEventListener('click', () => {
  fltRow.classList.toggle('row-act-fil');
  fltAll.forEach((label) => {
    label.classList.remove('act-fil');
  });
});

function toggleActFilClass(labelElement) {
  fltAll.forEach((label) => {
    label.classList.remove('act-fil');
  });
  labelElement.classList.add('act-fil');
}

fltAll.forEach((label) => {
  label.addEventListener('click', () => {
    toggleActFilClass(label);
  });
});

const faTableFund = document.getElementById('faTableFund');
const actBtnRow = document.querySelector('.actBtnRow');
const faCheckboxes = faTableFund.querySelectorAll('.table-select input');
const totalAmountSpan = document.querySelector('.totalAmountSpan');
const totalRowsSpan = document.querySelector('.totalRowsSpan');
const faInvPlur = document.querySelector('.faInvPlur');
const faSelectAllCheckbox = faTableFund.querySelector(
  '.table-header-row input'
);
let totalAmount = 0;

function updateTotals() {
  totalAmount = 0;
  let selectedRowCount = 0;

  faCheckboxes.forEach((checkbox) => {
    const amount = parseFloat(checkbox.getAttribute('data-amount'));

    if (checkbox.checked) {
      totalAmount += amount;
      selectedRowCount += 1;
    }
  });

  const formattedTotal = totalAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });

  totalAmountSpan.textContent = formattedTotal;
  totalRowsSpan.textContent = selectedRowCount;

  if (selectedRowCount > 1) {
    faInvPlur.style.display = 'inline-block';
  } else {
    faInvPlur.style.display = 'none';
  }

  if (selectedRowCount > 0 || faSelectAllCheckbox.checked) {
    actBtnRow.style.display = 'block';
  } else {
    actBtnRow.style.display = 'none';
    totalAmount = 0;
  }
}

faCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', updateTotals);
});

faSelectAllCheckbox.addEventListener('change', () => {
  faCheckboxes.forEach((checkbox) => {
    checkbox.checked = faSelectAllCheckbox.checked;
  });
  updateTotals();
});

// CHAT
const contactChat = document.querySelector('#messageContainer');
const prompt = document.querySelector('#prompt');
const sendButton = document.querySelector('#sendButton');
const firstChat = contactChat.querySelector('.firstChat');
const secondChat = contactChat.querySelector('.secondChat');
const handleSuccess = contactChat.querySelector('.handleSuccess');
const handleError = contactChat.querySelector('.handleError');
const messageObject = {
  contact: null,
  message: null,
};

// on input focus display first question
prompt.addEventListener('click', () => {
  firstChat.classList.remove('hide');
  prompt.scrollIntoView({ behavior: 'smooth' });
});

// on "submit" take the text and add it to the conversation
prompt.addEventListener('input', () => {
  sendButton.disabled = prompt.value.trim() === '';
});

sendButton.addEventListener('click', (e) => {
  e.preventDefault();
  prompt.style.height = 'auto';
  const rawMessage = prompt.value;
  const message = String(rawMessage).trim();
  if (message.trim() === '') {
    sendButton.disabled = true;
  } else {
    sendButton.disabled = false;
    if (secondChat.classList.contains('hide')) {
      const htmlMessage = `
                          <div class="chat answer">
                            <p>${message.replace(/\n/g, '<br>')}</p>
                            <span class="time">Now</span>
                          </div>`;
      secondChat.insertAdjacentHTML('beforeBegin', htmlMessage);
      prompt.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        secondChat.classList.remove('hide');
        prompt.scrollIntoView({ behavior: 'smooth' });
      }, 1000);
      messageObject.message = message;
      prompt.value = '';
      sendButton.disabled = true;
      prompt.focus();
    } else {
      const htmlMessage = `
                                  <div class="chat answer">
                                    <p>${message.replace(/\n/g, '<br>')}</p>
                                    <span class="time">Now</span>
                                  </div>`;
      handleSuccess.insertAdjacentHTML('beforeBegin', htmlMessage);
      messageObject.contact = message;
      sendMessage();
    }
  }
});

function sendMessage() {
  prompt.disabled = true;
  prompt.value = '';
  sendButton.disabled = true;
  handleError.classList.add('hide');
  handleSuccess.classList.add('hide');

  // thinking

  console.log(messageObject.message);
  console.log(messageObject.contact);

  fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageObject),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Message sent successfully
        handleSuccess.classList.remove('hide');
        prompt.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Handle the error
        handleError.classList.remove('hide');
        prompt.scrollIntoView({ behavior: 'smooth' });
      }
    })
    .catch((error) => {
      // Catch any exceptions that may occur
      handleError.classList.remove('hide');
      prompt.scrollIntoView({ behavior: 'smooth' });
    });
}

const chatSendAgain = document.querySelector('#chatSendAgain');
chatSendAgain.addEventListener('click', sendAnother);

function sendAnother() {
  secondChat.classList.add('hide');
  handleSuccess.classList.add('hide');
  const answers = document.querySelectorAll('#contact .answer');
  answers.forEach((answer) => {
    answer.remove();
  });
  prompt.disabled = false;
  prompt.focus();
}

function copyEmail(event) {
  const email = 'hi@rccpll.com';
  navigator.clipboard.writeText(email);
  const copyButton = event.currentTarget;
  const copyMessage = copyButton.querySelector('span');
  copyMessage.style.opacity = '0.8';
  setTimeout(() => {
    copyMessage.style.opacity = '0';
  }, 2000);
}

const copyButtons = document.querySelectorAll('.copy-btn');
copyButtons.forEach((button) => {
  button.addEventListener('click', copyEmail);
});

const chatTryAgain = document.querySelector('#chatTryAgain');
chatTryAgain.addEventListener('click', sendMessage);

prompt.addEventListener('input', () => {
  prompt.style.height = 'auto';
  prompt.style.height = `${prompt.scrollHeight + 2}px`;
});

// STATE BUTTONS

const mainMain = document.querySelector('body > main');
const clrBtn = document.querySelector('#clrBtn');
const darkBtn = document.querySelector('#darkBtn');

clrBtn.addEventListener('click', () => {
  clrBtn.classList.toggle('clr');
  mainMain.classList.toggle('clr');
});

function switcher(prefName, offLabel, onLabel, suffix, defaultValue, apply) {
  let enabled;
  function sync() {
    apply(enabled);
    try {
      if (localStorage.getItem(prefName) || enabled !== defaultValue) {
        localStorage.setItem(prefName, enabled);
      }
    } catch (e) {}
  }

  darkBtn.addEventListener('click', () => {
    enabled = +!enabled;
    sync();
  });
  try {
    enabled = localStorage.getItem(prefName);
  } catch (e) {}
  enabled = +(enabled || defaultValue);
  sync();
  return sync;
}

let darkModeDefault = 0;
try {
  darkModeDefault = matchMedia('(prefers-color-scheme: dark)').matches;
} catch (e) {}

const colorSchemeMeta = document.querySelector('meta[name=color-scheme]');
let stylesheetElements = document.querySelectorAll(
  '[media="screen and (prefers-color-scheme: dark)"]'
);

const syncDarkMode = switcher(
  'dark',
  'light',
  'dark',
  ' theme',
  darkModeDefault,
  (enabled) => {
    colorSchemeMeta.content = enabled ? 'dark' : 'light';
    stylesheetElements.forEach((element) => {
      element.media = enabled ? 'screen' : 'not all';
    });
  }
);

// If anything is in the source after this script, handle it.
document.addEventListener('DOMContentLoaded', () => {
  stylesheetElements = [
    ...stylesheetElements,
    ...document.querySelectorAll(
      '[media="screen and (prefers-color-scheme: dark)"]'
    ),
  ];
  syncDarkMode();
});
