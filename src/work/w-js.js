/* eslint-disable no-empty */
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

/** nifht mode */
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
    document.querySelector('meta[name=color-scheme]').content = enabled
      ? 'dark'
      : 'light';
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
