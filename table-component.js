const template = document.createElement('template')
template.innerHTML = `
<style>
.firstRowItems{
  color: var(--red);
  text-align: left;
}
th,td{
  padding: 0.5rem 1rem;
}
tfoot{
  color:var(--red);
  font-weight:700;
}
</style>

<table>
<thead>
  <tr id="tableTitles"></tr>
</thead>
<tbody id="tableItems"></tbody>
<tfoot>
  <tr id="summaryItems"></tr>
</tfoot>
</table>
`

class TableComponent extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true))
  }

  static get observedAttributes() {
    return ['summary', 'data']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Changed ${name} from ${oldValue} to ${newValue}`)
    //Summary
    if (this.getAttribute('summary', 'data')) {
      this.shadowRoot.querySelector('#summaryItems').innerHTML =
        this.createSummaryRow().join('')
    }
  }

  connectedCallback() {
    let attributes = this.getAttributeNames().map((attr) => {
      return { attribute: attr, value: this.getAttribute(attr) }
    })
    console.table(attributes)
    //Title Row
    if (
      this.getAttribute('columns') &&
      typeof this.getAttribute('columns') === 'string'
    ) {
      this.shadowRoot.querySelector('#tableTitles').innerHTML =
        this.createTitleRow().join('')
    } else {
      this.shadowRoot.querySelector(
        'table'
      ).innerHTML = `<h2>Table cannot be displayed - invalid column attribute</h2>`
    }

    //Fetch Data + Data Row
    if (
      this.getAttribute('data') &&
      typeof this.getAttribute('data') === 'string'
    ) {
      fetch(this.getAttribute('data'))
        .then((response) => response.json())
        .then(
          (data) =>
            (this.shadowRoot.querySelector('#tableItems').innerHTML =
              this.createDataRows(data).join(''))
        )
    } else {
      this.shadowRoot.querySelector(
        'table'
      ).innerHTML = `<h2>Table cannot be displayed - invalid data attribute</h2>`
    }
    //Sort
    this.shadowRoot
      .querySelector('thead')
      .addEventListener('click', this.handleSortName.bind(this))
  }

  disconnectedCallback() {
    console.log(`Disconnecting!`)
    this.shadowRoot
      .querySelector('thead')
      .removeEventListener('click', this._handleSortName.bind(this))
    this.shadow.innerHTML = ''
  }

  //HELPERS
  splitAttributes(i) {
    return i.split(',')
  }

  getCleanData(i) {
    i.map((item) => {
      if (
        this.getAttribute('fill-data-rules') &&
        typeof this.getAttribute('fill-data-rules') === 'string'
      ) {
        const itemWithNull = Object.entries(item).filter((e) =>
          e.includes(null)
        )[0][0]
        const array = Object.values(item)
        const indexOfMissingItem = Object.values(item).indexOf(null)
        const missingValue = this.checkWhatsMissing(array, indexOfMissingItem)
        item[itemWithNull] = missingValue
      }
      return item
    })
    if (this.getAttribute('summary')) this.updateSummary(i)
  }

  checkWhatsMissing(array, index) {
    const currentFill = this.getCorrectFill(index)
    const splitFill = currentFill.split('')
    const numbers = splitFill.filter(Number)
    const sign = splitFill[3]
    const firstElement = numbers[1]
    const secondElement = numbers[2]
    return eval(array[firstElement] + sign + array[secondElement])
  }

  getCorrectFill(index) {
    const fillDataItems = this.splitAttributes(
      this.getAttribute('fill-data-rules')
    )
    return fillDataItems.filter((e) => e.charAt(0) === index.toString())[0]
  }

  handleSortName(e) {
    console.log(e.originalTarget.innerText.toLowerCase())
  }

  updateSummary(i) {
    const newData = this.splitAttributes(this.getAttribute('summary'))
    let quantity = 0
    let price = 0
    let sum = 0
    const length = i.length
    i.forEach((i) => {
      quantity += i.quantity
      price += i.unit_price
      sum += i.total_value
    })
    newData[0] = '-'
    newData[1] = length
    newData[2] = quantity
    newData[3] = `~${Math.floor(price / length)}`
    newData[4] = sum
    this.setAttribute('summary', newData)
  }

  //Table Elements

  createTitleRow() {
    return this.splitAttributes(this.getAttribute('columns')).map((item) => {
      return `<th class="firstRowItems">${item}</th>`
    })
  }

  createDataRows(i) {
    this.getCleanData(i)
    return i.map((item) => {
      return `<tr>${Object.values(item)
        .map((v) => {
          return `<td>${v}</td>`
        })
        .join('')}</tr>`
    })
  }

  createSummaryRow() {
    return this.splitAttributes(this.getAttribute('summary')).map((item) => {
      return `<td>${item}</td>`
    })
  }
}

customElements.define('table-component', TableComponent)
