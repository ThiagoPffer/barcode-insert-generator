const IPT_QUANTIDADE = document.getElementById('quantidade');
const IPT_BANCO = document.getElementById('banco');
const IPT_DATA = document.getElementById('data');
const IPT_VALOR = document.getElementById('valor');
const IPT_CHECK_VALOR = document.getElementById('check-valor');
const H_ERROR = document.getElementById('error');
const DIV_BARCODES = document.getElementById('barcodes');
const DIV_LOADING_BAR = document.getElementById('loading-bar');
const DIV_LOADING_BAR_STATUS = document.getElementById('loading-bar-status');
const BTN_GENERATE = document.getElementById('generate-btn');

if (window.Worker) {
  const BC_WORKER = new Worker('barcodeWorker.js');
  let docId = null;

  BTN_GENERATE.addEventListener('click', () => {
    try {
      [IPT_QUANTIDADE, IPT_BANCO, IPT_DATA, IPT_VALOR].forEach(ipt => {
        if (!ipt.hasAttribute('disabled') && (!ipt.value || ipt.value === '')) throw new Error('Preencha todos os campos');
      });
      H_ERROR.innerText = '';
      DIV_BARCODES.innerHTML = '';
      docId = crypto.randomUUID().substring(0, 6).toUpperCase();
      const quantidade = Number(IPT_QUANTIDADE.value);
      
      if (quantidade > 20000) {
        throw new Error('A quantidade não deve exceder 20.000 códigos')
      }

      const banco = IPT_BANCO.value.length === 3 ? IPT_BANCO.value : `${getChars('0', 3 - IPT_BANCO.value.length)}${IPT_BANCO.value}`

      let valor = null;
      if (!IPT_CHECK_VALOR.checked) { valor = getBcValue(Number(IPT_VALOR.value)); }
  
      DIV_LOADING_BAR.setAttribute('style', `display: flex;`)
  
      for (let i = 0; i < quantidade; i++) {
        BC_WORKER.postMessage([banco, IPT_DATA.value, valor, i, quantidade]);
      }

    } catch(error) {
      H_ERROR.innerText = error.message;
    }
  })

  BC_WORKER.onmessage = (event) => {
    const { bcData, percentage } = event.data;

    DIV_LOADING_BAR_STATUS.setAttribute('style', `width: ${percentage}%`)
    let li = `<li>${getInsert({ ...bcData, docId })}</li>`
    DIV_BARCODES.innerHTML += li;

    if (percentage >= 100) {
      DIV_LOADING_BAR.setAttribute('style', `display: none;`)
      DIV_LOADING_BAR_STATUS.setAttribute('style', `width: 0%`)
    }
  }
}

const toggleCheck = (checked) => {
  if (checked) {
    IPT_VALOR.setAttribute('disabled', true);
  } else {
    IPT_VALOR.removeAttribute('disabled');
  }
}

const getBcValue = (value) => {
  let strValue = String(value);
  let arr = strValue.includes('.') ? strValue.split('.') : [strValue, '00'];
  if (arr[1].length < 2) { arr[1] = `${arr[1]}0` }
  if (arr[0].length < 8) { arr[0] = `${getChars('0', 8-arr[0].length)}${arr[0]}` }
  return arr.join('');
}

const getChars = (char, numberOfChars) => {
  let chars = '';
  for (let i = 0; i < numberOfChars; i++) { chars += char; }
  return chars;
}

const getInsert = (data) => {
  const { bank, barcode, duedate, value, docId, index } = data;
  const insertQuery = `INSERT INTO erp_fin_financas4.dda_pendencia (banco, tipo_inscricao_filial, cpf_cnpj_filial, especie_tipo_titulo_id, movimento_remessa, codigo_barras, vencimento, valor, documento, emissao, tipo_desconto, valor_desconto, data_desconto, juros, tipo_multa, valor_multa, data_multa, abatimento, usuario_geracao, data_geracao, usuario_alteracao, data_alteracao, log_importacao_id, tipo_inscricao_fornecedor, cpf_cnpj_fornecedor, situacao_associacao, tipo_associacao, situacao_integracao, log_integracao, nome_arquivo, nome_fornecedor, cpf_cnpj_fornecedor_raiz, filial_associada_id) VALUES('${bank}', '2', 76639285000177, 12, 1, '${barcode}', '${duedate}', ${value}, '${getDocument(docId, index)}', '${new Date().toISOString().split('T')[0]}', NULL, NULL, NULL, 3.43, NULL, NULL, NULL, NULL, 'admin', '${new Date().toISOString().split('T')[0]} 12:00:00.000', 'admin', '${new Date().toISOString().split('T')[0]} 12:00:00.000', 4055, '9', 56824266000103, 0, 0, NULL, NULL, 'TESTE_PENDENCIA_DDA_THIAGO_1.RET', 'Fornecedor Agropil', 56824266, 65);`;
  return insertQuery;
}

const getDocument = (docId, index) => {
  const docid = docId;
  const docnum = String(index).padStart(5, '0');
  return `${docid}${docnum}`;
}