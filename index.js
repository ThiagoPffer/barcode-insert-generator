const IPT_QUANTIDADE = document.getElementById('quantidade');
const IPT_TENANT = document.getElementById('tenant');
const IPT_LOG_IMPORTACAO_ID = document.getElementById('log_importacao_id');
const IPT_NOME_ARQUIVO = document.getElementById('nome_arquivo');

const IPT_NOME_FORNECEDOR = document.getElementById('nome_fornecedor');
const IPT_CPF_CNPJ_FORNECEDOR = document.getElementById('cpf_cnpj_fornecedor');
const IPT_TIPO_INSCRICAO_FORNECEDOR = document.getElementById('tipo_inscricao_fornecedor');

const IPT_TIPO_MOVIMENTO = document.getElementById('tipo_movimento');
const IPT_BANCO = document.getElementById('banco');
const IPT_DATA = document.getElementById('data');
const IPT_VALOR = document.getElementById('valor');
const IPT_CHECK_VALOR = document.getElementById('check-valor');

const IPT_TIPO_INSCRICAO_FILIAL = document.getElementById('tipo_inscricao_filial');
const IPT_CPF_CNPJ_FILIAL = document.getElementById('cpf_cnpj_filial');
const IPT_ID_FILIAL = document.getElementById('id_filial');

const H_ERROR = document.getElementById('error');
const DIV_BARCODES = document.getElementById('barcodes');
const OL_BARCODES = document.getElementById('barcode-list');
const DIV_LOG_IMPORTACAO = document.getElementById('log-importacao');
const DIV_LOG_IMPORTACAO_INSERT = document.getElementById('log-importacao-insert');
const DIV_LOADING_BAR = document.getElementById('loading-bar');
const DIV_LOADING_BAR_STATUS = document.getElementById('loading-bar-status');
const BTN_GENERATE = document.getElementById('generate-btn');
const BTN_COPY = document.getElementById('copy-btn');

if (window.Worker) {
  const BC_WORKER = new Worker('./worker.js');
  let docId = null;

  BTN_GENERATE.addEventListener('click', () => {
    try {
      resetErrorAndLoading();
      verifyFilledFields();

      docId = getNewDocId();
      const amount = getAmount();
      const bank = getBank();
      let value = getValue();
  
      DIV_LOADING_BAR.setAttribute('style', `display: flex;`)
  
      for (let i = 0; i < amount; i++) {
        BC_WORKER.postMessage({bank, date: IPT_DATA.value, value, amount, index: i});
      }

    } catch(error) {
      H_ERROR.innerText = error.message;
    }
  })

  BC_WORKER.onmessage = (event) => {
    const { bcData, percentage } = event.data;

    DIV_LOADING_BAR_STATUS.setAttribute('style', `width: ${percentage}%`);
    let li = `<li>${getInsert({ ...bcData, docId })}</li>`;
    OL_BARCODES.innerHTML += li;

    if (percentage >= 100) {
      setLogImportacao();
      DIV_LOADING_BAR.setAttribute('style', `display: none;`);
      DIV_LOADING_BAR_STATUS.setAttribute('style', `width: 0%`);
      BTN_COPY.setAttribute('style', 'display: block;');
      DIV_BARCODES.setAttribute('style', 'display: block;');
    }
  }
}

BTN_COPY.addEventListener('click', () => {
  const barcodes = OL_BARCODES.innerText;
  navigator.clipboard.writeText(barcodes);
  alert(`${IPT_QUANTIDADE.value} registros copiados para a área de transferência`);
});

const verifyFilledFields = () => {
  [
    IPT_QUANTIDADE, 
    IPT_TENANT, 
    IPT_LOG_IMPORTACAO_ID, 
    IPT_NOME_ARQUIVO, 
    IPT_NOME_FORNECEDOR, 
    IPT_CPF_CNPJ_FORNECEDOR, 
    IPT_TIPO_INSCRICAO_FORNECEDOR, 
    IPT_TIPO_MOVIMENTO, 
    IPT_BANCO, 
    IPT_DATA, 
    IPT_VALOR, 
    IPT_TIPO_INSCRICAO_FILIAL, 
    IPT_CPF_CNPJ_FILIAL, 
    IPT_ID_FILIAL
  ].forEach(ipt => {
    if (!ipt.hasAttribute('disabled') && (!ipt.value || ipt.value === '')) throw new Error('Preencha todos os campos');
  });

  if (IPT_QUANTIDADE.value > 20000) {
    throw new Error('A quantidade não deve exceder 20.000 registros')
  }
}

const resetErrorAndLoading = () => {
  H_ERROR.innerText = '';
  OL_BARCODES.innerHTML = '';
  DIV_BARCODES.setAttribute('style', 'display: none;');
  
  DIV_LOG_IMPORTACAO.removeAttribute('style');
  DIV_LOG_IMPORTACAO.setAttribute('style', 'display: none;');
}

const setLogImportacao = () => {
  DIV_LOG_IMPORTACAO.removeAttribute('style');
  DIV_LOG_IMPORTACAO.setAttribute('style', 'display: block;');
  DIV_LOG_IMPORTACAO_INSERT.innerHTML = getInsertLogImportacao();
}

const getInsertLogImportacao = () => {
  return `INSERT INTO erp_fin_${IPT_TENANT.value}.log_importacao (id, nome_arquivo, status, data_geracao, usuario_geracao, servico) VALUES(${IPT_LOG_IMPORTACAO_ID.value}, '${IPT_NOME_ARQUIVO.value}.RET', 1, '${new Date().toISOString().split('T')[0]} 12:00:00.000', 'admin@${IPT_TENANT.value}.com.br', 'dda_debitodiretoautorizado');`;
}

const getNewDocId = () => {
  return crypto.randomUUID().substring(0, 6).toUpperCase();
}

const getAmount = () => {
  return Number(IPT_QUANTIDADE.value);
}

const getBank = () => {
  return IPT_BANCO.value.length === 3 ? IPT_BANCO.value : `${getChars('0', 3 - IPT_BANCO.value.length)}${IPT_BANCO.value}`;
}

const getValue = () => {
  return !IPT_CHECK_VALOR.checked ? getBcValue(Number(IPT_VALOR.value)) : null;
}

const getCpfCnpjFornecedorRaiz = () => {
  if (String(IPT_TIPO_INSCRICAO_FORNECEDOR.value) === '2') {
    return String(IPT_CPF_CNPJ_FORNECEDOR.value).substring(0, 8);
  }
  return IPT_CPF_CNPJ_FORNECEDOR;
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
  const insertQuery = `INSERT INTO erp_fin_${IPT_TENANT.value}.dda_pendencia (banco, tipo_inscricao_filial, cpf_cnpj_filial, especie_tipo_titulo_id, movimento_remessa, codigo_barras, vencimento, valor, documento, emissao, tipo_desconto, valor_desconto, data_desconto, juros, tipo_multa, valor_multa, data_multa, abatimento, usuario_geracao, data_geracao, usuario_alteracao, data_alteracao, log_importacao_id, tipo_inscricao_fornecedor, cpf_cnpj_fornecedor, situacao_associacao, tipo_associacao, situacao_integracao, log_integracao, nome_arquivo, nome_fornecedor, cpf_cnpj_fornecedor_raiz, filial_associada_id) VALUES('${bank}', '${IPT_TIPO_INSCRICAO_FILIAL.value}', ${IPT_CPF_CNPJ_FILIAL.value}, 12, ${IPT_TIPO_MOVIMENTO.value}, '${barcode}', '${duedate}', ${value}, '${getDocument(docId, index)}', '${new Date().toISOString().split('T')[0]}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'admin', '${new Date().toISOString().split('T')[0]} 12:00:00.000', 'admin', '${new Date().toISOString().split('T')[0]} 12:00:00.000', ${IPT_LOG_IMPORTACAO_ID.value}, '${IPT_TIPO_INSCRICAO_FORNECEDOR.value}', ${IPT_CPF_CNPJ_FORNECEDOR.value}, 0, 0, NULL, NULL, '${IPT_NOME_ARQUIVO.value}.RET', '${IPT_NOME_FORNECEDOR.value}', ${getCpfCnpjFornecedorRaiz()}, ${IPT_ID_FILIAL.value});`;
  return insertQuery;
}

const getDocument = (docId, index) => {
  const docid = docId;
  const docnum = String(index).padStart(5, '0');
  return `${docid}${docnum}`;
}