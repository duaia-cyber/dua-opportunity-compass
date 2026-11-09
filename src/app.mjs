import { analyse } from './analysis.mjs';
import { createCalendarReference, createPlanCalendar } from './calendar.mjs';
import { encodeWorkspace, decodeWorkspace } from './workspace.mjs';
import { detectSignals, findAmounts, findGaps, buildChecklist, buildCountdown, explicitDeadlines, localIsoDay, findContactEmails } from './insights.mjs';
import { readPdfFile, pageOfLine } from './pdf.mjs';

const copy = {
  en: {
    prototype:'Independent prototype', eyebrow:'CREATIVE WORK DESERVES A CLEARER PATH', heroTitle:['See the opportunity.','Know what to do.'], heroDescription:'Turn a public call into a clear, reviewable plan. Keep the original evidence close, so nothing important gets lost in the summary.', startReview:'Review an opportunity', tryExample:'Try the example', heroNote:'A decision aid, never an eligibility verdict.', stepOne:'Add a public call', stepTwo:'Review evidence', stepThree:'Make a plan', madeFor:'FOR CREATIVE PEOPLE & TEAMS', workspaceEyebrow:'YOUR WORKSPACE', workspaceTitle:'Start with the source.', workspaceIntro:'Paste the public call, or explore a clearly labelled fictional example.', loadExample:'Load example', sourceLabel:'Opportunity text', sourcePlaceholder:'Paste the official description, including any requirements and deadline…', sourceHint:'Use public information and review the original notice.', urlLabel:'Official source link (optional)', urlHint:'A reference for your review. The page is not fetched.', compareTitle:'Compare a previous version', previousLabel:'Earlier text', previousPlaceholder:'Paste the earlier version here…', compareHint:'We show textual differences, not legal conclusions.', privacyNote:'Your text is processed in this browser. This prototype does not send it to a server.', analyse:'Find what needs review', reviewEyebrow:'02 / REVIEW THE EVIDENCE', resultsTitle:'Make the call, with context.', resultsIntro:'These are possible points to check, not verified facts or eligibility decisions.', openSource:'Open original source', pointsFound:'points to review', markedReviewed:'marked reviewed', reviewSummaryNote:'Every point links back to the text you provided.', evidenceTitle:'Evidence, not assumptions', evidenceHint:'Review each excerpt', noEvidence:'No matching excerpts found. Check the source manually; absence here does not mean a requirement does not exist.', changesTitle:'What changed in the text', changesHint:'Literal comparison', changesNote:'Different wording does not necessarily mean a change in rules.', planStep:'03 / YOUR PLAN', planTitle:'A brief you can trust.', planDescription:'Keep the excerpts and your review status together. Confirm details with the organiser before applying.', planInitial:'Your review is in progress', downloadBrief:'Download review brief', printBrief:'Print or save as PDF', planSmall:'No application is sent. The brief is created on this device.', reviewFooter:'Built to support human judgment, not replace it. Always check the official rules.', connectionLabel:'A DUA LAB EXPERIMENT', connectionTitle:'From discovery to doing.', connectionDescription:'DUA connects creative work, community and opportunity. This independent prototype explores a possible future companion to Radar Cultural; it is not connected to DUA accounts or live data.', visitDua:'Visit DUA', footerText:'An independent Kiroween prototype · Built for creative communities', backToTop:'Back to top ↑', enterText:'Paste an opportunity or load the example first.', badUrl:'Use a valid http or https source link, or leave it empty.', markReviewed:'Mark reviewed', undoReview:'Undo review', reviewed:'Reviewed', notReviewed:'Not reviewed', candidate:'Candidate excerpt · verify against source', explicit:'Date present; verify time and time zone', ambiguous:'Ambiguous date · check the original', incomplete:'Incomplete date · check the original', invalid:'Invalid date · check the original', added:'Added text', removed:'Removed text', noChanges:'No literal line differences found.', demoWarning:'Fictional example · not a real opportunity', briefTitle:'Opportunity review brief', briefIntro:'Human review required. This document does not establish eligibility.', source:'Source', sourceNotProvided:'Not provided', sample:'Fictional example, not a real opportunity.', checked:'reviewed', unchecked:'not reviewed', changesBrief:'Literal text differences', noCandidates:'No candidate excerpts detected.', categories:{deadline:'Deadline',eligibility:'Eligibility',documents:'Documents',costs:'Costs',funding:'Funding'}, example:`FICTIONAL EXAMPLE — CREATIVE FUTURES FUND\nApplications close on 4 December 2026 at 17:00 Lisbon time.\nEligible applicants: independent creators and small creative teams based in Portugal.\nFunding: selected projects may receive up to €5,000 to cover project costs.\nRequired documents: a short project description and a budget.\nCo-financing: not specified here; check the official notice.`, previous:`FICTIONAL EARLIER EXAMPLE — CREATIVE FUTURES FUND\nApplications close on 20 November 2026 at 17:00 Lisbon time.\nEligible applicants: independent creators and small creative teams based in Portugal.\nFunding: selected projects may receive up to €5,000 to cover project costs.\nRequired documents: a short project description and a budget.\nCo-financing: not specified here; check the official notice.`
  },
  pt: {
    prototype:'Protótipo independente', eyebrow:'CRIAR MERECE UM CAMINHO MAIS CLARO', heroTitle:['Vê a oportunidade.','Sabe o que fazer.'], heroDescription:'Transforma uma chamada pública num plano claro para rever. Mantém os excertos originais por perto para não perderes o que importa.', startReview:'Rever uma oportunidade', tryExample:'Experimentar exemplo', heroNote:'Uma ajuda à decisão, nunca um parecer de elegibilidade.', stepOne:'Adicionar chamada', stepTwo:'Rever evidências', stepThree:'Preparar plano', madeFor:'PARA CRIADORES E EQUIPAS', workspaceEyebrow:'O TEU ESPAÇO DE TRABALHO', workspaceTitle:'Começa pela fonte.', workspaceIntro:'Cola a chamada pública ou explora um exemplo fictício identificado.', loadExample:'Carregar exemplo', sourceLabel:'Texto da oportunidade', sourcePlaceholder:'Cola a descrição oficial, incluindo os requisitos e o prazo…', sourceHint:'Usa informação pública e revê o aviso original.', urlLabel:'Ligação à fonte oficial (opcional)', urlHint:'Uma referência para a tua revisão. A página não é consultada automaticamente.', compareTitle:'Comparar uma versão anterior', previousLabel:'Texto anterior', previousPlaceholder:'Cola aqui a versão anterior…', compareHint:'Mostramos diferenças no texto, não conclusões jurídicas.', privacyNote:'O texto é tratado neste navegador. Este protótipo não o envia para um servidor.', analyse:'Identificar pontos a rever', reviewEyebrow:'02 / REVER AS EVIDÊNCIAS', resultsTitle:'Decide com contexto.', resultsIntro:'Estes são possíveis pontos a verificar, não factos confirmados nem decisões de elegibilidade.', openSource:'Abrir fonte original', pointsFound:'pontos a rever', markedReviewed:'marcados como revistos', reviewSummaryNote:'Cada ponto remete para o texto que forneceste.', evidenceTitle:'Evidências, sem suposições', evidenceHint:'Revê cada excerto', noEvidence:'Não foram encontrados excertos correspondentes. Confirma o aviso manualmente; a ausência aqui não significa que o requisito não exista.', changesTitle:'O que mudou no texto', changesHint:'Comparação literal', changesNote:'Uma alteração de palavras não significa necessariamente uma alteração das regras.', planStep:'03 / O TEU PLANO', planTitle:'Um resumo para rever.', planDescription:'Guarda os excertos e o estado da tua revisão. Confirma os detalhes com a organização antes de te candidatares.', planInitial:'A tua revisão está em curso', downloadBrief:'Descarregar resumo', printBrief:'Imprimir ou guardar em PDF', planSmall:'Nenhuma candidatura é enviada. O resumo é criado neste dispositivo.', reviewFooter:'Criado para apoiar a decisão humana. Confirma sempre as regras oficiais.', connectionLabel:'UMA EXPERIÊNCIA DUA LAB', connectionTitle:'Da descoberta à ação.', connectionDescription:'A DUA liga criação, comunidade e oportunidades. Este protótipo independente explora um possível complemento futuro ao Radar Cultural; não está ligado a contas DUA nem a dados em tempo real.', visitDua:'Visitar a DUA', footerText:'Protótipo independente Kiroween · Criado para comunidades criativas', backToTop:'Voltar ao início ↑', enterText:'Cola uma oportunidade ou carrega primeiro o exemplo.', badUrl:'Usa uma ligação http ou https válida, ou deixa o campo vazio.', markReviewed:'Marcar como revisto', undoReview:'Anular revisão', reviewed:'Revisto', notReviewed:'Por rever', candidate:'Excerto candidato · confirma na fonte', explicit:'Data presente; confirma a hora e o fuso', ambiguous:'Data ambígua · confirma no original', incomplete:'Data incompleta · confirma no original', invalid:'Data inválida · confirma no original', added:'Texto acrescentado', removed:'Texto removido', noChanges:'Não foram encontradas diferenças literais entre linhas.', demoWarning:'Exemplo fictício · não é uma oportunidade real', briefTitle:'Resumo de revisão da oportunidade', briefIntro:'Requer revisão humana. Este documento não estabelece elegibilidade.', source:'Fonte', sourceNotProvided:'Não indicada', sample:'Exemplo fictício, não é uma oportunidade real.', checked:'revisto', unchecked:'por rever', changesBrief:'Diferenças literais no texto', noCandidates:'Não foram encontrados excertos candidatos.', categories:{deadline:'Prazo',eligibility:'Elegibilidade',documents:'Documentos',costs:'Custos',funding:'Apoio'}, example:`EXEMPLO FICTÍCIO — FUNDO FUTUROS CRIATIVOS\nAs candidaturas terminam a 4 de dezembro de 2026 às 17h00, hora de Lisboa.\nElegibilidade: criadores independentes e pequenas equipas criativas sediadas em Portugal.\nApoio: os projetos selecionados podem receber até 5.000 € para custos do projeto.\nDocumentos necessários: uma descrição breve do projeto e um orçamento.\nCofinanciamento: não especificado neste exemplo; consultar o aviso oficial.`, previous:`EXEMPLO ANTERIOR FICTÍCIO — FUNDO FUTUROS CRIATIVOS\nAs candidaturas terminam a 20 de novembro de 2026 às 17h00, hora de Lisboa.\nElegibilidade: criadores independentes e pequenas equipas criativas sediadas em Portugal.\nApoio: os projetos selecionados podem receber até 5.000 € para custos do projeto.\nDocumentos necessários: uma descrição breve do projeto e um orçamento.\nCofinanciamento: não especificado neste exemplo; consultar o aviso oficial.`
  }
};

Object.assign(copy.en, {
  reviewSummaryNote:'Each point is shown with its source excerpt.',
  planTitle:'Your review, in one place.',
  changesHint:'Added and removed lines',
  changesNote:'Line order is not compared. Different wording does not necessarily mean a change in rules.',
  noChanges:'No added or removed lines found. Line order is not compared.',
  privacyNote:'Your text stays in this browser until you reload. This prototype does not send it to a server.',
  partialEvidence:'Only the first 200 matching excerpts are shown. Review the complete source.',
  partialChanges:'Only the first 200 text differences are shown. Compare the complete sources.',
  nextStep:'Suggested check',
  calendarAction:'Download calendar reference',
  calendarHint:'All-day reference only. Confirm the exact time and time zone before importing.',
  analysisError:'Could not complete the review. Check your text and try again.',
  calendarError:'Could not create the calendar reference. Check the date in the original notice.',
  saveWorkspace:'Save working copy', openWorkspace:'Open working copy',
  workspaceCopyHint:'A local file keeps your text and notes. Nothing is uploaded.',
  workspaceError:'This working copy is invalid or too large. Choose a valid Opportunity Compass file.',
  saveError:'Could not save this working copy. Check the source link and text size.',
  noteLabel:'Your note (optional)', notePlaceholder:'Add a question or next step…', notePrefix:'Your note',
  checks:{deadline:'Confirm the date, time and time zone.',eligibility:'Compare this with your circumstances.',documents:'Gather the required documents.',costs:'Check fees and financing conditions.',funding:'Check the scope and conditions of the support.'}
});
Object.assign(copy.pt, {
  reviewSummaryNote:'Cada ponto apresenta o excerto do texto de origem.',
  planTitle:'A tua revisão num só lugar.',
  changesHint:'Linhas acrescentadas e removidas',
  changesNote:'A ordem das linhas não é comparada. Uma alteração de palavras não significa necessariamente uma alteração das regras.',
  noChanges:'Não foram encontradas linhas acrescentadas ou removidas. A ordem não é comparada.',
  privacyNote:'O texto fica neste navegador até recarregares a página. Este protótipo não o envia para um servidor.',
  partialEvidence:'Só são apresentados os primeiros 200 excertos encontrados. Revê a fonte completa.',
  partialChanges:'Só são apresentadas as primeiras 200 diferenças. Compara as fontes completas.',
  nextStep:'Verificação sugerida',
  calendarAction:'Descarregar data para calendário',
  calendarHint:'Apenas referência de dia inteiro. Confirma a hora e o fuso antes de importar.',
  analysisError:'Não foi possível concluir a revisão. Verifica o texto e tenta novamente.',
  calendarError:'Não foi possível criar a data para calendário. Confirma o prazo no aviso original.',
  saveWorkspace:'Guardar trabalho', openWorkspace:'Abrir trabalho guardado',
  workspaceCopyHint:'Um ficheiro local guarda o texto e as notas. Nada é carregado para um servidor.',
  workspaceError:'O ficheiro é inválido ou demasiado grande. Escolhe um ficheiro do Opportunity Compass.',
  saveError:'Não foi possível guardar o trabalho. Confirma a ligação e o tamanho do texto.',
  noteLabel:'A tua nota (opcional)', notePlaceholder:'Adiciona uma dúvida ou próximo passo…', notePrefix:'A tua nota',
  checks:{deadline:'Confirma a data, a hora e o fuso.',eligibility:'Compara com a tua situação.',documents:'Reúne os documentos pedidos.',costs:'Confirma custos e condições de financiamento.',funding:'Confirma o âmbito e as condições do apoio.'}
});
// The fictional example tells a small story: between versions the deadline moved
// and a perpetual licence clause was added. Both should surface without being hunted for.
const exampleLines={
  en:['FICTIONAL EXAMPLE — CREATIVE FUTURES FUND','Applications close on 4 December 2026 at 17:00 Lisbon time.','Eligible applicants: independent creators and small creative teams based in Portugal.','Funding: selected projects may receive up to €5,000 to cover project costs.','Required documents: a short project description, a portfolio and a budget.','Co-financing: not specified here; check the official notice.','Selected works grant the organiser a perpetual, worldwide licence to use them.','Payment will be made in two instalments, the second after final delivery.','Incomplete applications will not be accepted.'],
  pt:['EXEMPLO FICTÍCIO — FUNDO FUTUROS CRIATIVOS','As candidaturas terminam a 4 de dezembro de 2026 às 17h00, hora de Lisboa.','Elegibilidade: criadores independentes e pequenas equipas criativas sediadas em Portugal.','Apoio: os projetos selecionados podem receber até 5.000 € para custos do projeto.','Documentos necessários: uma descrição breve do projeto, um portefólio e um orçamento.','Cofinanciamento: não especificado neste exemplo; consultar o aviso oficial.','As obras selecionadas concedem à entidade promotora uma licença perpétua e mundial de utilização.','O pagamento será feito em duas prestações, a segunda após a entrega final.','As candidaturas incompletas não serão aceites.']
};
copy.en.example=exampleLines.en.join('\n');
copy.en.previous=exampleLines.en.filter((line)=>!line.startsWith('Selected works')).join('\n').replace('4 December 2026','20 November 2026');
copy.pt.example=exampleLines.pt.join('\n');
copy.pt.previous=exampleLines.pt.filter((line)=>!line.startsWith('As obras selecionadas')).join('\n').replace('4 de dezembro de 2026','20 de novembro de 2026');

Object.assign(copy.en, {
  boardEyebrow:'CRITICAL READING', boardTitle:'What a careful reader would notice.', boardIntro:'Patterns found in your text, each tied to the line it came from. Read them as prompts, not conclusions.',
  tileDays:'days to the deadline', tileDaysOne:'day to the deadline', tileToday:'The deadline in the text is today', tilePassed:'The date in the text has passed', tileNoDeadline:'No explicit deadline date detected', tileDateFrom:'Read from the text · confirm in the notice',
  tileAmount:'Amount quoted in the text', tileNoAmount:'No amount detected', tileSignals:'clauses to read carefully', tileGaps:'topics the text does not seem to cover', tileReady:'ready', tileReadyNote:'Your preparation, not an eligibility decision',
  signalsTitle:'Alerts for creative work', signalsHint:'Clauses worth a second read', noSignals:'No rights, fee, payment or exclusion wording detected. That does not mean there is none: read the full notice.', newInVersion:'New in this version', unspecified:'Not specified in the text',
  signalNames:{rights:'Rights & licence',exclusivity:'Exclusivity',fee:'Entry fee',unpaid:'Unpaid work',payment:'Payment timing',exclusion:'Grounds for exclusion',match:'Co-financing'},
  signalChecks:{rights:'Who keeps the rights to your work, for how long, where and for what uses?',exclusivity:'Can you show, sell or submit this work elsewhere?',fee:'Is the fee refundable, and is it worth the odds?',unpaid:'Is the work paid? Weigh the time it takes against what you get back.',payment:'When does money actually arrive? Plan your cash flow around it.',exclusion:'A formal mistake can end the application. Check this rule against your submission.',match:'Do you need to cover part of the cost yourself? Confirm the amount.'},
  gapsTitle:'What the text does not say', gapsHint:'Not detected in the text you supplied', noGaps:'The text mentions a deadline, amount, contact, criteria, rights and payment timing. Still confirm each one in the notice.',
  gapNames:{deadline:'No deadline line',deadlineDate:'No explicit deadline date',deadlineRelative:'Deadline counted from another date',amount:'No amount',contact:'No contact for questions',criteria:'No selection criteria',rights:'Nothing about rights',paymentTiming:'No payment timing'},
  gapQuestions:{deadline:'What is the exact closing date, time and time zone?',deadlineRelative:'From which date is the deadline counted, and what are the resulting closing date, time and time zone?',deadlineDate:'Can you confirm the closing date as day, month and year, with time and time zone?',amount:'What is the amount of support, and is it per project or per person?',contact:'Who can answer questions about the call, and by when?',criteria:'How will applications be assessed, and by whom?',rights:'Who keeps the rights to the submitted and funded work?',paymentTiming:'When and in how many payments will the support be paid?'},
  copyQuestions:'Copy questions for the organiser', copiedQuestions:'Questions copied. Review them before sending.', copyFailed:'Could not copy. Select the questions manually.', questionsIntro:'Questions to confirm with the organiser:',
  countdownTitle:'Countdown to the deadline', countdownStatusText:'Date read from the text · not yet reviewed', countdownStatusReviewed:'You reviewed this deadline', countdownMultiple:'Several explicit dates were found. The countdown uses the one with the strongest deadline wording; confirm which one applies.', noCountdown:'No explicit date to count down to. Find the closing date in the official notice.', countdownPassed:'This date has passed. Check whether the call is still open.', countdownNote:'Suggested working milestones to organise yourself, not dates set by the organiser.', milestonePast:'already past',
  milestones:{gather:'Gather documents and permissions',draft:'Write the first draft',budget:'Close the budget and figures',review:'Final review with fresh eyes',submit:'Submit with a day to spare'},
  readyTitle:'Readiness checklist', readyHint:'Tick what you already have', readyDocuments:'Documents to prepare', readyConditions:'Conditions to check against your situation', noReady:'No document or eligibility lines were detected. Build your list from the official notice.', readyNote:'Readiness tracks your preparation. It never says you are eligible.', readyLabel:'ready',
  briefSignals:'Alerts for creative work', briefGaps:'What the text does not say (not detected)', briefCountdown:'Countdown', briefChecklist:'Readiness checklist', briefDays:'days to', briefAsOf:'counted on', briefNone:'None detected.'
});
Object.assign(copy.pt, {
  boardEyebrow:'LEITURA CRÍTICA', boardTitle:'O que um leitor atento repararia.', boardIntro:'Padrões encontrados no teu texto, cada um ligado à linha de onde veio. Lê-os como pistas, não como conclusões.',
  tileDays:'dias até ao prazo', tileDaysOne:'dia até ao prazo', tileToday:'O prazo indicado no texto é hoje', tilePassed:'A data indicada no texto já passou', tileNoDeadline:'Não foi detetada uma data de prazo explícita', tileDateFrom:'Lido do texto · confirma no aviso',
  tileAmount:'Montante citado no texto', tileNoAmount:'Montante não detetado', tileSignals:'cláusulas a ler com atenção', tileGaps:'temas que o texto parece não cobrir', tileReady:'pronto', tileReadyNote:'A tua preparação, não uma decisão de elegibilidade',
  signalsTitle:'Alertas para criativos', signalsHint:'Cláusulas que merecem segunda leitura', noSignals:'Não foi detetada linguagem sobre direitos, taxas, pagamentos ou exclusão. Isso não garante que não exista: lê o aviso completo.', newInVersion:'Novo nesta versão', unspecified:'Não especificado no texto',
  signalNames:{rights:'Direitos e licença',exclusivity:'Exclusividade',fee:'Taxa de inscrição',unpaid:'Trabalho não pago',payment:'Prazos de pagamento',exclusion:'Motivos de exclusão',match:'Cofinanciamento'},
  signalChecks:{rights:'Quem fica com os direitos da tua obra, por quanto tempo, onde e para que usos?',exclusivity:'Podes mostrar, vender ou candidatar esta obra noutro lado?',fee:'A taxa é reembolsável e compensa as hipóteses?',unpaid:'O trabalho é pago? Compara o tempo que exige com o que recebes.',payment:'Quando é que o dinheiro chega mesmo? Planeia a tesouraria com isso.',exclusion:'Um erro formal pode excluir a candidatura. Confirma esta regra na tua submissão.',match:'Tens de suportar parte do custo? Confirma o valor.'},
  gapsTitle:'O que o texto não diz', gapsHint:'Não detetado no texto fornecido', noGaps:'O texto refere prazo, montante, contacto, critérios, direitos e calendário de pagamento. Confirma mesmo assim cada um no aviso.',
  gapNames:{deadline:'Sem linha de prazo',deadlineDate:'Sem data de prazo explícita',deadlineRelative:'Prazo contado a partir de outra data',amount:'Sem montante',contact:'Sem contacto para dúvidas',criteria:'Sem critérios de seleção',rights:'Nada sobre direitos',paymentTiming:'Sem calendário de pagamento'},
  gapQuestions:{deadline:'Qual é a data exata de encerramento, com hora e fuso horário?',deadlineRelative:'A partir de que data é contado o prazo e qual é a data, hora e fuso de encerramento?',deadlineDate:'Podem confirmar a data de encerramento (dia, mês e ano), com hora e fuso horário?',amount:'Qual é o valor do apoio e é por projeto ou por pessoa?',contact:'Quem responde a dúvidas sobre a chamada e até quando?',criteria:'Como serão avaliadas as candidaturas e por quem?',rights:'Quem fica com os direitos da obra submetida e apoiada?',paymentTiming:'Quando e em quantas prestações será pago o apoio?'},
  copyQuestions:'Copiar perguntas para a organização', copiedQuestions:'Perguntas copiadas. Revê-as antes de enviar.', copyFailed:'Não foi possível copiar. Seleciona as perguntas manualmente.', questionsIntro:'Perguntas a confirmar com a organização:',
  countdownTitle:'Contagem até ao prazo', countdownStatusText:'Data lida do texto · ainda por rever', countdownStatusReviewed:'Reviste este prazo', countdownMultiple:'Foram encontradas várias datas explícitas. A contagem usa a que tem linguagem de prazo mais forte; confirma qual se aplica.', noCountdown:'Não há uma data explícita para contar. Procura a data de encerramento no aviso oficial.', countdownPassed:'Esta data já passou. Confirma se a chamada continua aberta.', countdownNote:'Marcos sugeridos para te organizares, não datas definidas pela organização.', milestonePast:'já passou',
  milestones:{gather:'Reunir documentos e autorizações',draft:'Escrever a primeira versão',budget:'Fechar orçamento e números',review:'Revisão final com olhos frescos',submit:'Submeter com um dia de folga'},
  readyTitle:'Checklist de prontidão', readyHint:'Marca o que já tens', readyDocuments:'Documentos a preparar', readyConditions:'Condições a confirmar com a tua situação', noReady:'Não foram detetadas linhas de documentos ou elegibilidade. Faz a tua lista a partir do aviso oficial.', readyNote:'A prontidão mede a tua preparação. Nunca diz que és elegível.', readyLabel:'pronto',
  briefSignals:'Alertas para criativos', briefGaps:'O que o texto não diz (não detetado)', briefCountdown:'Contagem', briefChecklist:'Checklist de prontidão', briefDays:'dias até', briefAsOf:'contado a', briefNone:'Nada detetado.'
});

Object.assign(copy.en, {
  workspaceIntro:'Paste the public call, import its PDF, or explore a clearly labelled fictional example.',
  sourcePlaceholder:'Paste the official description, or import the PDF of the call…',
  importPdf:'Import PDF', pdfPrivacy:'PDF text is read in this browser with pdf.js. The file is not uploaded.', pdfReading:'Reading the PDF in this browser…',
  pdfDone:'{name} · {pages} pages · text read in this browser; wrapped lines were re-joined. Check it before analysing.', pdfTruncated:'Only the first 150,000 characters were kept (up to page {page}).', pdfEmptyPages:'{n} page(s) have no text layer (scanned?) and are marked in the text.', pdfPagesRestored:'Page numbers restored from the working copy.', pageShort:'p.', lineShort:'line', showInText:'Show in text',
  pdfError:{notPdf:'Choose a PDF file.',tooLarge:'This PDF is larger than 25 MB. Copy the text and paste it instead.',protected:'This PDF is password-protected. Open it, copy the text and paste it.',unreadable:'This PDF could not be read. Copy the text and paste it instead.',noText:'This PDF has no text layer (probably scanned). Copy the text from the original or type it.'},
  lensTitle:'Evidence lens', lensHint:'Every line of your text, coloured by what was found. Click a line or a finding to jump.', lensAlert:'Alert', lensPage:'Page',
  kitTitle:'Application kit', planCalendar:'Calendar with milestones', planCalendarLocked:'Mark the deadline excerpt reviewed to unlock the calendar.', planCalendarNone:'No explicit deadline date for a calendar.', planCalendarHint:'All-day entries: the deadline day from the text plus suggested milestones.',
  emailDraft:'E-mail draft with questions', emailDraftTo:'E-mail draft to {email}', emailHint:'Opens your e-mail app with the questions. Nothing is sent by this page.', emailNone:'No open questions detected for the organiser.', emailSubject:'Questions about the call', emailFooter:'Drafted with DUA Opportunity Compass from the public notice. Please confirm.',
  rangeClosing:'period: closing date read as {date}', suggested:'SUGGESTED', deadlineDay:'Deadline day (from the notice)', briefSourceFile:'Source file', pagesWord:'pages', briefPagesNote:'text read in this browser'
});
Object.assign(copy.pt, {
  workspaceIntro:'Cola a chamada pública, importa o PDF ou explora um exemplo fictício identificado.',
  sourcePlaceholder:'Cola a descrição oficial ou importa o PDF da chamada…',
  importPdf:'Importar PDF', pdfPrivacy:'O texto do PDF é lido neste navegador com pdf.js. O ficheiro não é carregado para nenhum servidor.', pdfReading:'A ler o PDF neste navegador…',
  pdfDone:'{name} · {pages} páginas · texto lido neste navegador; as linhas partidas foram unidas. Confirma antes de analisar.', pdfTruncated:'Só foram mantidos os primeiros 150.000 caracteres (até à página {page}).', pdfEmptyPages:'{n} página(s) sem camada de texto (digitalizadas?) estão assinaladas no texto.', pdfPagesRestored:'Números de página repostos a partir do trabalho guardado.', pageShort:'p.', lineShort:'linha', showInText:'Ver no texto',
  pdfError:{notPdf:'Escolhe um ficheiro PDF.',tooLarge:'Este PDF tem mais de 25 MB. Copia o texto e cola-o.',protected:'Este PDF está protegido por palavra-passe. Abre-o, copia o texto e cola-o.',unreadable:'Não foi possível ler este PDF. Copia o texto e cola-o.',noText:'Este PDF não tem camada de texto (provavelmente digitalizado). Copia o texto do original ou escreve-o.'},
  lensTitle:'Lente de evidência', lensHint:'Cada linha do teu texto, colorida pelo que foi encontrado. Clica numa linha ou num ponto para saltar.', lensAlert:'Alerta', lensPage:'Página',
  kitTitle:'Kit de candidatura', planCalendar:'Calendário com marcos', planCalendarLocked:'Marca o excerto do prazo como revisto para desbloquear o calendário.', planCalendarNone:'Sem data de prazo explícita para um calendário.', planCalendarHint:'Entradas de dia inteiro: o dia do prazo lido do texto e os marcos sugeridos.',
  emailDraft:'Rascunho de email com perguntas', emailDraftTo:'Rascunho de email para {email}', emailHint:'Abre a tua aplicação de email com as perguntas. Esta página não envia nada.', emailNone:'Não foram detetadas perguntas em aberto para a organização.', emailSubject:'Dúvidas sobre a chamada', emailFooter:'Rascunho preparado com o DUA Opportunity Compass a partir do aviso público. Agradecemos confirmação.',
  rangeClosing:'período: data de fecho lida como {date}', suggested:'SUGESTÃO', deadlineDay:'Dia do prazo (lido do aviso)', briefSourceFile:'Ficheiro de origem', pagesWord:'páginas', briefPagesNote:'texto lido neste navegador'
});

const $ = (selector) => document.querySelector(selector);
const nodes = {form:$('#sourceForm'), text:$('#sourceText'), url:$('#sourceUrl'), previous:$('#previousText'), count:$('#sourceCount'), error:$('#formError'), results:$('#results'), list:$('#evidenceList'), empty:$('#emptyEvidence'), changesSection:$('#changesSection'), changes:$('#changesList'), link:$('#sourceLink'), announcement:$('#announcement')};
let language='en';
let current=null;
let sampleLoaded=false;
let reviewed=new Set();
let notes=new Map();
let ready=new Set();
let pdfInfo=null;

function setLanguage(next) {
  language=next;
  document.documentElement.lang=next;
  const t=copy[next];
  document.querySelectorAll('[data-i18n]').forEach((node)=>{
    const key=node.dataset.i18n;
    if(key==='heroTitle') {
      const em=document.createElement('em'); em.textContent=t.heroTitle[1];
      node.replaceChildren(document.createTextNode(t.heroTitle[0]), document.createElement('br'), em);
    } else if(typeof t[key]==='string') node.textContent=t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node)=>{node.placeholder=t[node.dataset.i18nPlaceholder]});
  document.querySelectorAll('[data-lang]').forEach((node)=>node.setAttribute('aria-pressed',String(node.dataset.lang===next)));
  renderPdfStatus();
  if(current) renderResults();
}

function element(tag, className, text) {
  const node=document.createElement(tag);
  if(className) node.className=className;
  if(text!==undefined) node.textContent=text;
  return node;
}

function clearResults() {
  current=null; reviewed=new Set(); notes=new Map(); ready=new Set(); nodes.results.hidden=true;
}

function safeUrl(value) {
  if(!value.trim()) return '';
  try { const url=new URL(value); return ['https:','http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}

function runAnalysis(event) {
  event?.preventDefault();
  nodes.error.textContent='';
  if(!nodes.text.value.trim()) {nodes.error.textContent=copy[language].enterText; nodes.text.focus(); return;}
  const url=safeUrl(nodes.url.value);
  if(url===null) {nodes.error.textContent=copy[language].badUrl; nodes.url.focus(); return;}
  try { current=analyse({text:nodes.text.value, previousText:nodes.previous.value, url}); }
  catch { clearResults(); nodes.error.textContent=copy[language].analysisError; return; }
  current.example=sampleLoaded;
  attachInsights(current, nodes.text.value);
  current.pages=validPageMap();
  reviewed=new Set();
  notes=new Map();
  ready=new Set();
  renderResults();
  nodes.results.hidden=false;
  nodes.results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  nodes.results.focus({preventScroll:true});
}

function attachInsights(result,text) {
  const items=Array.isArray(result.items)?result.items:[];
  result.signals=detectSignals(text);
  result.amounts=findAmounts(text);
  result.gaps=findGaps(text,items,result.signals,result.amounts);
  result.checklist=buildChecklist(items);
  result.deadlines=explicitDeadlines(items);
  result.addedLines=new Set((result.changes||[]).filter((change)=>change.kind==='added').map((change)=>change.quote.trim()));
}

function formatDay(iso,options={day:'numeric',month:'short'}) {
  return new Intl.DateTimeFormat(language==='pt'?'pt-PT':'en-GB',{...options,timeZone:'UTC'}).format(new Date(`${iso}T00:00:00Z`));
}

function countdownState() {
  const deadline=current.deadlines?.[0];
  if(!deadline) return null;
  return {deadline,countdown:buildCountdown({iso:deadline.date.iso,today:localIsoDay()}),reviewed:reviewed.has(String(deadline.id))};
}

// Clauses new in this version first, firm clauses next, "not specified" ones last.
function orderedSignals() {
  const hasPrevious=Boolean(nodes.previous.value.trim());
  const rank=(signal)=>(signal.unspecified?2:0)-(hasPrevious && current.addedLines.has(signal.quote)?1:0);
  return [...current.signals].sort((a,b)=>rank(a)-rank(b));
}

function questionsText() {
  const t=copy[language];
  return [t.questionsIntro,'',...current.gaps.map((gap)=>`- ${t.gapQuestions[gap]}`)].join('\n');
}

function validPageMap() {
  if(!pdfInfo) return [];
  return nodes.text.value.split('\n').length===pdfInfo.lineCount ? pdfInfo.pages : [];
}

function motion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
}

function flash(node) {
  node.classList.remove('is-flash');
  void node.offsetWidth;
  node.classList.add('is-flash');
}

function pageBadge(line) {
  const page=pageOfLine(current.pages||[],line);
  return page?element('span','page-badge',`${copy[language].pageShort} ${page}`):null;
}

function lineLink(line) {
  const t=copy[language];
  const page=pageOfLine(current.pages||[],line);
  const link=element('button','line-link',`${t.showInText} · ${t.lineShort} ${line}${page?` · ${t.pageShort} ${page}`:''}`);
  link.type='button';
  link.addEventListener('click',()=>focusLens(line));
  return link;
}

function focusLens(line) {
  const row=document.getElementById(`lens-${line}`);
  if(!row) return;
  row.scrollIntoView({behavior:motion(),block:'center'});
  flash(row);
  row.focus({preventScroll:true});
}

function jumpToFinding(line) {
  const target=document.querySelector(`.evidence-item[data-line="${line}"]`)||document.querySelector(`.signal[data-line="${line}"]`);
  if(!target) return;
  target.scrollIntoView({behavior:motion(),block:'center'});
  flash(target);
}

function renderLens() {
  const t=copy[language];
  const body=$('#lensBody'); const legend=$('#lensLegend');
  body.replaceChildren(); legend.replaceChildren();
  const lines=nodes.text.value.split('\n');
  const byLine=new Map();
  const mark=(line,kind,label)=>{ if(!byLine.has(line)) byLine.set(line,[]); const marks=byLine.get(line); if(!marks.some((m)=>m.kind===kind)) marks.push({kind,label}); };
  for(const item of current.items||[]) mark(item.line,`cat-${item.category}`,t.categories[item.category]||item.category);
  for(const signal of current.signals||[]) if(!signal.unspecified) mark(signal.line,'cat-alert',t.lensAlert);
  for(const [cls,label] of [['cat-deadline',t.categories.deadline],['cat-eligibility',t.categories.eligibility],['cat-documents',t.categories.documents],['cat-costs',t.categories.costs],['cat-funding',t.categories.funding],['cat-alert',t.lensAlert]]) legend.append(element('span',`lens-chip ${cls}`,label));
  const pages=current.pages||[];
  const starts=new Set(pages);
  const fragment=document.createDocumentFragment();
  lines.forEach((raw,index)=>{
    const n=index+1;
    if(pages.length>1 && starts.has(n)) fragment.append(element('div','lens-page',`${t.lensPage} ${pageOfLine(pages,n)}`));
    const marks=byLine.get(n)||[];
    const alert=marks.find((m)=>m.kind==='cat-alert');
    const lead=alert||marks[0];
    const row=element('div',`lens-line${lead?` is-marked ${lead.kind}`:''}${raw.trim()?'':' is-blank'}`);
    row.id=`lens-${n}`; row.dataset.line=String(n);
    row.append(element('span','lens-no',String(n)),element('span','lens-text',raw));
    if(marks.length){
      const tags=element('span','lens-tags');
      for(const m of marks.slice(0,3)) tags.append(element('i',`lens-tag ${m.kind}`,m.label));
      row.append(tags);
      row.tabIndex=0; row.setAttribute('role','button');
      row.addEventListener('click',()=>jumpToFinding(n));
      row.addEventListener('keydown',(event)=>{ if(event.key==='Enter'||event.key===' '){ event.preventDefault(); jumpToFinding(n); } });
    }
    fragment.append(row);
  });
  body.append(fragment);
}

function contactEmail() {
  const emails=findContactEmails(nodes.text.value);
  return emails.length===1 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(emails[0]) ? emails[0] : '';
}

function renderKit() {
  const t=copy[language];
  const state=countdownState();
  const button=$('#planCalendarButton'); const hint=$('#planCalendarHint');
  if(!state) { button.disabled=true; hint.textContent=t.planCalendarNone; }
  else if(!state.reviewed) { button.disabled=true; hint.textContent=t.planCalendarLocked; }
  else if(state.countdown.passed) { button.disabled=true; hint.textContent=t.countdownPassed; }
  else { button.disabled=false; hint.textContent=t.planCalendarHint; }
  const link=$('#emailDraft'); const emailHint=$('#emailHint');
  emailHint.hidden=false;
  if(!current.gaps.length) { link.hidden=true; link.removeAttribute('href'); emailHint.textContent=t.emailNone; return; }
  const to=contactEmail();
  const body=`${questionsText()}${current.sourceUrl?`\n\n${t.source}: ${current.sourceUrl}`:''}\n\n${t.emailFooter}`;
  link.href=`mailto:${to}?subject=${encodeURIComponent(t.emailSubject)}&body=${encodeURIComponent(body)}`;
  link.hidden=false;
  link.querySelector('span').textContent=to?t.emailDraftTo.replace('{email}',to):t.emailDraft;
  emailHint.textContent=t.emailHint;
}

function renderPdfStatus() {
  const t=copy[language];
  const status=$('#pdfStatus');
  if(!pdfInfo) { status.hidden=true; status.textContent=''; status.className='pdf-status'; return; }
  const parts=[pdfInfo.name?t.pdfDone.replace('{name}',pdfInfo.name).replace('{pages}',String(pdfInfo.pageCount)):t.pdfPagesRestored];
  if(pdfInfo.truncated) parts.push(t.pdfTruncated.replace('{page}',String(pdfInfo.truncatedAtPage||pdfInfo.pagesRead)));
  if(pdfInfo.emptyPages) parts.push(t.pdfEmptyPages.replace('{n}',String(pdfInfo.emptyPages)));
  status.hidden=false; status.className='pdf-status'; status.textContent=parts.join(' ');
}

async function importPdf(file) {
  const t=copy[language];
  const status=$('#pdfStatus');
  if(!file) return;
  pdfInfo=null;
  status.hidden=false; status.className='pdf-status is-busy'; status.textContent=t.pdfReading;
  try {
    const result=await readPdfFile(file);
    nodes.text.value=result.text;
    nodes.count.textContent=String(result.text.length);
    sampleLoaded=false; nodes.error.textContent=''; clearResults();
    pdfInfo={name:result.name,pages:result.pages,lineCount:result.lineCount,pageCount:result.pageCount,pagesRead:result.pagesRead,truncated:result.truncated,truncatedAtPage:result.truncatedAtPage,emptyPages:result.emptyPages};
    renderPdfStatus();
    nodes.announcement.textContent=status.textContent;
    nodes.text.focus();
  } catch(error) {
    status.hidden=false; status.className='pdf-status is-error';
    status.textContent=t.pdfError[error?.code]||t.pdfError.unreadable;
    nodes.announcement.textContent=status.textContent;
  }
}

function cardHeader(card,id,title,hint) {
  const head=element('div','card-head');
  const h=element('h4','',title); h.id=id;
  head.append(h,element('span','',hint));
  card.replaceChildren(head);
}

function renderBoard() {
  const t=copy[language];
  const hasPrevious=Boolean(nodes.previous.value.trim());
  const state=countdownState();
  const total=current.checklist.length;
  const done=current.checklist.filter((entry)=>ready.has(entry.id)).length;
  const percent=total?Math.round(done/total*100):0;
  const signalCount=current.signals.filter((signal)=>!signal.unspecified).length;

  // Snapshot tiles
  const snapshot=$('#snapshot'); snapshot.replaceChildren();
  const tile=(className,value,label,note)=>{const node=element('div',`tile ${className}`);node.append(element('strong','tile-value',value),element('span','tile-label',label));if(note) node.append(element('span','tile-note',note));snapshot.append(node);return node;};
  if(!state) tile('tile-deadline is-empty','—',t.tileNoDeadline);
  else if(state.countdown.passed) tile('tile-deadline is-warning','!',t.tilePassed,formatDay(state.deadline.date.iso,{day:'numeric',month:'long',year:'numeric'}));
  else if(state.countdown.daysLeft===0) tile('tile-deadline is-warning','0',t.tileToday,t.tileDateFrom);
  else tile('tile-deadline',String(state.countdown.daysLeft),state.countdown.daysLeft===1?t.tileDaysOne:t.tileDays,`${formatDay(state.deadline.date.iso,{day:'numeric',month:'long',year:'numeric'})} · ${t.tileDateFrom}`);
  if(current.amounts.length) tile('tile-amount',current.amounts[0].raw,t.tileAmount,current.amounts.length>1?`+${current.amounts.length-1}`:'');
  else tile('tile-amount is-empty','—',t.tileNoAmount);
  tile(`tile-signals${signalCount?' is-alert':''}`,String(signalCount),t.tileSignals,current.gaps.length?`${current.gaps.length} ${t.tileGaps}`:'');
  const readyTile=tile('tile-ready',`${percent}%`,`${done}/${total} ${t.tileReady}`,t.tileReadyNote);
  readyTile.style.setProperty('--p',String(percent));
  readyTile.prepend(element('span','ring'));

  // Alerts
  const signals=$('#signalsCard');
  cardHeader(signals,'signals-title',t.signalsTitle,t.signalsHint);
  if(!current.signals.length) signals.append(element('p','card-empty',t.noSignals));
  const list=element('ul','signal-list');
  for(const signal of orderedSignals()){
    const row=element('li',`signal signal-${signal.kind}${signal.unspecified?' is-unspecified':''}`);
    row.dataset.line=String(signal.line);
    const tags=element('div','signal-tags');
    tags.append(element('span','signal-kind',t.signalNames[signal.kind]));
    const badge=pageBadge(signal.line); if(badge) tags.append(badge);
    if(hasPrevious && current.addedLines.has(signal.quote)) tags.append(element('span','signal-new',t.newInVersion));
    if(signal.unspecified) tags.append(element('span','signal-muted',t.unspecified));
    row.append(tags,element('blockquote','',signal.quote),element('p','signal-check',t.signalChecks[signal.kind]),lineLink(signal.line));
    list.append(row);
  }
  if(current.signals.length) signals.append(list);

  // Gaps
  const gaps=$('#gapsCard');
  cardHeader(gaps,'gaps-title',t.gapsTitle,t.gapsHint);
  if(!current.gaps.length) gaps.append(element('p','card-empty',t.noGaps));
  else {
    const gapList=element('ul','gap-list');
    for(const gap of current.gaps){const row=element('li','gap');row.append(element('b','',t.gapNames[gap]),element('span','',t.gapQuestions[gap]));gapList.append(row);}
    const copyButton=element('button','copy-questions',t.copyQuestions); copyButton.type='button';
    copyButton.addEventListener('click',async()=>{
      try {await navigator.clipboard.writeText(questionsText()); nodes.announcement.textContent=t.copiedQuestions; copyButton.textContent=t.copiedQuestions;}
      catch {nodes.announcement.textContent=t.copyFailed; copyButton.textContent=t.copyFailed;}
    });
    gaps.append(gapList,copyButton);
  }

  // Countdown
  const countdown=$('#countdownCard');
  cardHeader(countdown,'countdown-title',t.countdownTitle,state?formatDay(state.deadline.date.iso,{day:'numeric',month:'long',year:'numeric'}):'');
  if(!state) countdown.append(element('p','card-empty',t.noCountdown));
  else {
    const status=element('p',`countdown-status${state.reviewed?' is-reviewed':''}`,state.reviewed?t.countdownStatusReviewed:t.countdownStatusText);
    countdown.append(status);
    if(current.deadlines.length>1) countdown.append(element('p','card-empty',t.countdownMultiple));
    if(state.countdown.passed) countdown.append(element('p','card-empty',t.countdownPassed));
    else {
      const track=element('ol','milestones');
      for(const milestone of state.countdown.milestones){
        const row=element('li',`milestone${milestone.past?' is-past':''}`);
        row.append(element('span','milestone-date',formatDay(milestone.iso)),element('span','milestone-label',t.milestones[milestone.key]),element('span','milestone-offset',milestone.past?t.milestonePast:`D−${milestone.offset}`));
        track.append(row);
      }
      const end=element('li','milestone is-deadline');
      end.append(element('span','milestone-date',formatDay(state.deadline.date.iso)),element('span','milestone-label',t.categories.deadline),element('span','milestone-offset','D'));
      track.append(end);
      countdown.append(track,element('p','card-note',t.countdownNote));
    }
  }

  // Readiness
  const readiness=$('#readinessCard');
  cardHeader(readiness,'ready-title',t.readyTitle,total?`${done}/${total} ${t.readyLabel}`:t.readyHint);
  if(!total) readiness.append(element('p','card-empty',t.noReady));
  else {
    const meter=element('div','ready-meter'); meter.setAttribute('role','progressbar'); meter.setAttribute('aria-valuemin','0'); meter.setAttribute('aria-valuemax','100'); meter.setAttribute('aria-valuenow',String(percent)); meter.setAttribute('aria-label',t.readyTitle);
    const fill=element('span'); fill.style.width=`${percent}%`; meter.append(fill);
    readiness.append(meter);
    for(const [kind,label] of [['document',t.readyDocuments],['condition',t.readyConditions]]){
      const entries=current.checklist.filter((entry)=>entry.kind===kind);
      if(!entries.length) continue;
      readiness.append(element('p','ready-group',label));
      const group=element('ul','ready-list');
      for(const entry of entries){
        const row=element('li','ready-item');
        const box=element('input'); box.type='checkbox'; box.id=`ready-${entry.id}`; box.checked=ready.has(entry.id);
        box.addEventListener('change',()=>{if(box.checked) ready.add(entry.id); else ready.delete(entry.id); renderBoard(); document.getElementById(`ready-${entry.id}`)?.focus();});
        const label=element('label','',entry.text); label.htmlFor=box.id;
        row.append(box,label); group.append(row);
      }
      readiness.append(group);
    }
    readiness.append(element('p','card-note',t.readyNote));
  }
}

function renderResults() {
  if(!current) return;
  const t=copy[language];
  nodes.list.replaceChildren();
  const items=Array.isArray(current.items)?current.items:[];
  $('#evidenceCount').textContent=String(items.length);
  $('#reviewedCount').textContent=String(reviewed.size);
  $('#partialEvidence').hidden=!current.itemsTruncated;
  $('#partialEvidence').textContent=t.partialEvidence;
  nodes.empty.hidden=items.length>0;
  $('#planStatus').textContent=current.example?t.demoWarning:t.planInitial;
  for(const [index,item] of items.entries()) {
    const key=String(item.id ?? index);
    const row=element('article','evidence-item');
    row.dataset.line=String(item.line);
    const category=element('div','evidence-category',t.categories[item.category] || item.category || '');
    const badge=pageBadge(item.line); if(badge) category.append(badge);
    const content=element('div','evidence-content');
    const quote=element('blockquote','',item.quote);
    content.append(quote);
    if(Number.isInteger(item.line)) content.append(lineLink(item.line));
    if(item.date?.raw){
      const status=t[item.date.status] || t.candidate;
      const range=item.date.range && item.date.iso ? ` · ${t.rangeClosing.replace('{date}',formatDay(item.date.iso,{day:'numeric',month:'long',year:'numeric'}))}` : '';
      content.append(element('p','evidence-meta',`${item.date.raw} · ${status}${range}`));
    }
    if(t.checks[item.category]) content.append(element('p','evidence-next',`${t.nextStep}: ${t.checks[item.category]}`));
    const actions=element('div','evidence-actions');
    const btn=element('button','review-button',reviewed.has(key)?t.undoReview:t.markReviewed);
    btn.type='button'; btn.classList.toggle('is-reviewed',reviewed.has(key));
    btn.setAttribute('aria-pressed',String(reviewed.has(key)));
    btn.addEventListener('click',()=>{
      if(reviewed.has(key)) reviewed.delete(key); else reviewed.add(key);
      renderResults();
      nodes.list.querySelectorAll('.review-button')[index]?.focus();
      nodes.announcement.textContent=reviewed.has(key)?t.reviewed:t.notReviewed;
    });
    actions.append(btn,element('span','candidate-flag',reviewed.has(key)?t.reviewed:t.candidate));
    if(item.category==='deadline' && item.date?.status==='explicit' && item.date.iso && reviewed.has(key)) {
      const calendar=element('button','calendar-button',t.calendarAction);
      calendar.type='button';
      calendar.addEventListener('click',()=>{
        try {
          const uid=globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const content=createCalendarReference({iso:item.date.iso,quote:item.quote,sourceUrl:current.sourceUrl,language,uid,now:new Date(),example:current.example});
          downloadFile(content,'text/calendar;charset=utf-8',current.example?'fictional-example-deadline.ics':'deadline-reference.ics');
        } catch { nodes.announcement.textContent=t.calendarError; }
      });
      actions.append(calendar);
      content.append(element('p','calendar-hint',t.calendarHint));
    }
    content.append(actions);
    if(reviewed.has(key)) {
      const label=element('label','note-field',t.noteLabel);
      label.htmlFor=`note-${key}`;
      const note=element('textarea','note-input');
      note.id=`note-${key}`; note.maxLength=1000; note.rows=2; note.placeholder=t.notePlaceholder; note.value=notes.get(key)||'';
      note.addEventListener('input',()=>{if(note.value) notes.set(key,note.value); else notes.delete(key)});
      content.append(label,note);
    }
    row.append(category,content); nodes.list.append(row);
  }
  const hasPrevious=Boolean(nodes.previous.value.trim());
  nodes.changesSection.hidden=!hasPrevious;
  nodes.changes.replaceChildren();
  if(hasPrevious) {
    $('#partialChanges').hidden=!current.changesTruncated;
    $('#partialChanges').textContent=t.partialChanges;
    const changes=Array.isArray(current.changes)?current.changes:[];
    if(!changes.length) nodes.changes.append(element('p','subtle',t.noChanges));
    changes.forEach((change)=>{
      const row=element('div','change-item');
      row.append(element('b','',change.kind==='added'?t.added:t.removed),element('span','',change.quote));
      nodes.changes.append(row);
    });
  }
  if(current.sourceUrl) {nodes.link.href=current.sourceUrl;nodes.link.hidden=false;} else {nodes.link.hidden=true;nodes.link.removeAttribute('href');}
  renderBoard();
  renderLens();
  renderKit();
}

function briefText() {
  const t=copy[language];
  const lines=[t.briefTitle,'',t.briefIntro,'',`${t.source}: ${current.sourceUrl||t.sourceNotProvided}`];
  const pageRef=(line)=>{ const page=pageOfLine(current.pages||[],line); return page?` (${t.pageShort} ${page})`:''; };
  if(current.pages?.length) lines.push(`${t.briefSourceFile}: ${pdfInfo?.name||'PDF'} · ${current.pages.length} ${t.pagesWord} · ${t.briefPagesNote}`);
  if(current.example) lines.push('',t.sample);
  lines.push('');
  const state=countdownState();
  lines.push(t.briefCountdown,'');
  if(!state) lines.push(t.noCountdown,'');
  else {
    lines.push(state.countdown.passed?`${state.deadline.date.iso} — ${t.countdownPassed}`:`${state.countdown.daysLeft} ${t.briefDays} ${state.deadline.date.iso} (${t.briefAsOf} ${localIsoDay()}) — ${state.reviewed?t.countdownStatusReviewed:t.countdownStatusText}`);
    if(!state.countdown.passed) for(const m of state.countdown.milestones) lines.push(`- ${m.iso} D−${m.offset}: ${t.milestones[m.key]}${m.past?` (${t.milestonePast})`:''}`);
    lines.push(t.countdownNote,'');
  }
  lines.push(t.briefSignals,'');
  if(!current.signals.length) lines.push(t.briefNone,'');
  for(const signal of orderedSignals()){
    const tags=[t.signalNames[signal.kind]];
    if(nodes.previous.value.trim() && current.addedLines.has(signal.quote)) tags.push(t.newInVersion);
    if(signal.unspecified) tags.push(t.unspecified);
    lines.push(`[${tags.join(' · ')}] ${signal.quote}${pageRef(signal.line)}`,`  → ${t.signalChecks[signal.kind]}`);
  }
  lines.push('',t.briefGaps,'');
  if(!current.gaps.length) lines.push(t.briefNone);
  for(const gap of current.gaps) lines.push(`- ${t.gapNames[gap]}: ${t.gapQuestions[gap]}`);
  lines.push('',t.briefChecklist,'');
  if(!current.checklist.length) lines.push(t.briefNone);
  for(const entry of current.checklist) lines.push(`[${ready.has(entry.id)?'x':' '}] ${entry.text}`);
  lines.push(t.readyNote,'');
  const items=Array.isArray(current.items)?current.items:[];
  if(current.itemsTruncated) lines.push(t.partialEvidence,'');
  if(!items.length) lines.push(t.noCandidates);
  for(const [index,item] of items.entries()){
    const key=String(item.id??index);
    lines.push(`${t.categories[item.category]||item.category} — ${reviewed.has(key)?t.checked:t.unchecked}${pageRef(item.line)}`,'',String(item.quote),'');
    if(t.checks[item.category]) lines.push(`${t.nextStep}: ${t.checks[item.category]}`,'');
    if(item.date?.raw) lines.push(`${item.date.raw} — ${t[item.date.status]||t.candidate}`,'');
    if(notes.has(key)) lines.push(`${t.notePrefix}: ${notes.get(key)}`,'');
  }
  if(nodes.previous.value.trim()) {
    lines.push(t.changesBrief,'',t.changesNote,'');
    if(current.changesTruncated) lines.push(t.partialChanges,'');
    for(const change of current.changes||[]) lines.push(`- ${change.kind==='added'?t.added:t.removed}: ${change.quote}`);
  }
  lines.push('',t.reviewFooter,'');
  return lines.join('\n');
}

function loadSample(){
  nodes.text.value=copy[language].example;
  nodes.previous.value=copy[language].previous;
  nodes.url.value='';
  nodes.previous.closest('details').open=true;
  nodes.count.textContent=String(nodes.text.value.length);
  sampleLoaded=true;
  pdfInfo=null; renderPdfStatus();
  runAnalysis();
}

function downloadFile(content,type,filename){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

nodes.form.addEventListener('submit',runAnalysis);
for(const node of [nodes.text,nodes.url,nodes.previous]) node.addEventListener('input',()=>{sampleLoaded=/^\s*(FICTIONAL EXAMPLE|EXEMPLO FICTÍCIO)/i.test(nodes.text.value);nodes.count.textContent=String(nodes.text.value.length);nodes.error.textContent='';clearResults(); if(pdfInfo && nodes.text.value.split('\n').length!==pdfInfo.lineCount){pdfInfo=null;renderPdfStatus();}});
$('#pdfButton').addEventListener('click',()=>$('#pdfFile').click());
$('#pdfFile').addEventListener('change',async(event)=>{ const file=event.target.files?.[0]; try { await importPdf(file); } finally { event.target.value=''; } });
const mainField=$('.field-main');
for(const type of ['dragenter','dragover']) mainField.addEventListener(type,(event)=>{ if([...(event.dataTransfer?.types||[])].includes('Files')){ event.preventDefault(); mainField.classList.add('is-dragover'); } });
mainField.addEventListener('dragleave',()=>mainField.classList.remove('is-dragover'));
mainField.addEventListener('drop',(event)=>{
  mainField.classList.remove('is-dragover');
  const file=event.dataTransfer?.files?.[0];
  if(!file) return;
  event.preventDefault();
  importPdf(file);
});
$('#planCalendarButton').addEventListener('click',()=>{
  if(!current) return;
  const state=countdownState();
  if(!state||!state.reviewed||state.countdown.passed) return;
  const t=copy[language];
  try {
    const stamp=Date.now().toString(36);
    const prefix=current.example?(language==='pt'?'EXEMPLO FICTÍCIO: ':'FICTIONAL EXAMPLE: '):'';
    const events=state.countdown.milestones.filter((m)=>!m.past).map((m,index)=>({iso:m.iso,uid:`plan-${stamp}-${index}`,summary:`${prefix}${t.suggested}: ${t.milestones[m.key]} (D-${m.offset})`,description:t.countdownNote}));
    events.push({iso:state.deadline.date.iso,uid:`plan-${stamp}-deadline`,summary:`${prefix}${t.deadlineDay}`,description:`${t.calendarHint}\n${state.deadline.quote}`});
    downloadFile(createPlanCalendar({events,sourceUrl:current.sourceUrl,now:new Date()}),'text/calendar;charset=utf-8',current.example?'fictional-example-plan.ics':'opportunity-plan.ics');
  } catch { nodes.announcement.textContent=copy[language].calendarError; }
});
document.querySelectorAll('[data-lang]').forEach((button)=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
$('#demoHero').addEventListener('click',loadSample);
$('#demoButton').addEventListener('click',loadSample);
$('#saveWorkspace').addEventListener('click',()=>{
  nodes.error.textContent='';
  if(!nodes.text.value.trim()) {nodes.error.textContent=copy[language].enterText;nodes.text.focus();return;}
  try {
    const encoded=encodeWorkspace({text:nodes.text.value,previousText:nodes.previous.value,url:nodes.url.value.trim(),reviewed:[...reviewed],notes:Object.fromEntries(notes),ready:[...ready],pages:validPageMap()});
    downloadFile(encoded,'application/json;charset=utf-8','dua-opportunity-workspace.json');
  } catch {nodes.error.textContent=copy[language].saveError;}
});
$('#openWorkspace').addEventListener('click',()=>$('#workspaceFile').click());
$('#workspaceFile').addEventListener('change',async(event)=>{
  const file=event.target.files?.[0];
  if(!file) return;
  try {
    if(file.size>600000) throw new Error('too large');
    const data=decodeWorkspace(await file.text());
    if(!data.text.trim()) throw new Error('empty');
    const analysis=analyse({text:data.text,previousText:data.previousText,url:data.url});
    nodes.text.value=data.text;nodes.previous.value=data.previousText;nodes.url.value=data.url;
    nodes.previous.closest('details').open=Boolean(data.previousText);
    nodes.count.textContent=String(data.text.length);nodes.error.textContent='';
    sampleLoaded=/^\s*(FICTIONAL EXAMPLE|EXEMPLO FICTÍCIO)/i.test(data.text);
    current=analysis;current.example=sampleLoaded;
    attachInsights(current,data.text);
    pdfInfo=data.pages.length?{name:null,pages:data.pages,lineCount:data.text.split('\n').length,pageCount:data.pages.length,pagesRead:data.pages.length,truncated:false,truncatedAtPage:null,emptyPages:0}:null;
    current.pages=data.pages;
    renderPdfStatus();
    const validIds=new Set(analysis.items.map(item=>item.id));
    reviewed=new Set(data.reviewed.filter(id=>validIds.has(id)));
    notes=new Map(Object.entries(data.notes).filter(([id])=>validIds.has(id)));
    const validReady=new Set(current.checklist.map(entry=>entry.id));
    ready=new Set(data.ready.filter(id=>validReady.has(id)));
    renderResults();nodes.results.hidden=false;
    nodes.announcement.textContent=copy[language].planInitial;
  } catch {nodes.error.textContent=copy[language].workspaceError;}
  finally {event.target.value='';}
});
$('#exportButton').addEventListener('click',()=>{
  if(!current) return;
  downloadFile(briefText(),'text/plain;charset=utf-8','dua-opportunity-brief.txt');
});
$('#printButton').addEventListener('click',()=>{if(current) window.print()});
setLanguage('en');
