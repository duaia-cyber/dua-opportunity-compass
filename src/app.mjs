import { analyse, MAX_TEXT_LENGTH } from './analysis.mjs';
import { createCalendarReference, createPlanCalendar } from './calendar.mjs';
import { encodeWorkspace, decodeWorkspace } from './workspace.mjs';
import { detectSignals, findAmounts, findGaps, buildChecklist, buildCountdown, explicitDeadlines, localIsoDay, findContactEmails } from './insights.mjs';
import { readPdfFile, pageOfLine } from './pdf.mjs';
import { textKey, titleFrom, summarize, upsert, sortEntries, toCsv } from './shortlist.mjs';
import { noticeCalendar, submissionRules, obligations, rulesChecklist } from './notice.mjs';
import { labelChanges } from './change-review.mjs';

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
  changesFilterLabel:'Lines',
  changesFilterAll:'All changes',
  changesFilterLabelled:'Lines with topics',
  changesCaveat:'Topics are tentative and incomplete; unlabelled lines may also matter.',
  changesNoTopics:'No lines with matching topics. Review all changes.',
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
  changesFilterLabel:'Linhas',
  changesFilterAll:'Todas as alterações',
  changesFilterLabelled:'Linhas com tópicos',
  changesCaveat:'Os tópicos são sugestões incompletas; as outras linhas também podem ser importantes.',
  changesNoTopics:'Não foram encontrados tópicos. Revê todas as alterações.',
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
  en:['FICTIONAL EXAMPLE — CREATIVE FUTURES FUND','Applications close on 4 December 2026 at 17:00 Lisbon time.','Eligible applicants: independent creators and small creative teams based in Portugal.','Funding: selected projects may receive up to €5,000 to cover project costs.','Required documents: a short project description, a portfolio and a budget.','Co-financing: not specified here; check the official notice.','Selected works grant the organiser a perpetual, worldwide licence to use them.','Payment will be made in two instalments, the second after final delivery.','Incomplete applications will not be accepted.','Questions may be sent until 20 November 2026.','Results will be announced on 18 December 2026.','The project description must not exceed 2 pages; portfolios up to 10 MB in PDF.','Applications must be written in Portuguese or English.','Selected creators must submit a final report within 30 days and credit the fund in all communication.'],
  pt:['EXEMPLO FICTÍCIO — FUNDO FUTUROS CRIATIVOS','As candidaturas terminam a 4 de dezembro de 2026 às 17h00, hora de Lisboa.','Elegibilidade: criadores independentes e pequenas equipas criativas sediadas em Portugal.','Apoio: os projetos selecionados podem receber até 5.000 € para custos do projeto.','Documentos necessários: uma descrição breve do projeto, um portefólio e um orçamento.','Cofinanciamento: não especificado neste exemplo; consultar o aviso oficial.','As obras selecionadas concedem à entidade promotora uma licença perpétua e mundial de utilização.','O pagamento será feito em duas prestações, a segunda após a entrega final.','As candidaturas incompletas não serão aceites.','As dúvidas podem ser enviadas até 20 de novembro de 2026.','Os resultados serão divulgados a 18 de dezembro de 2026.','A descrição do projeto não pode exceder 2 páginas; portefólios até 10 MB em PDF.','As candidaturas devem ser redigidas em português ou em inglês.','Os criadores selecionados devem entregar um relatório final no prazo de 30 dias e mencionar o fundo em toda a comunicação.']
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
  rangeClosing:'period: closing date read as {date}', suggested:'SUGGESTED',
  heroNoDeadlineBadge:'Deadline not confirmed', heroCloses:'Closes', heroToday:'Today', heroExample:'Fictional example', heroPasted:'Pasted text',
  hlAlerts:'Alerts by type', hlReady:'Preparation', hlWindow:'Work window', hlWindowStart:'Start', hlGaps:'Open questions', hlNoGaps:'None detected', hlContact:'Contact', hlNoContact:'No e-mail detected', noReadyShort:'no checklist', moreAmounts:'+{n} more in the text',
  windowBefore:'Preparation starts {date}', windowInside:'Day {n} of {total} of the work window',
  shortSignals:{rights:'Rights',exclusivity:'Exclusive',fee:'Entry fee',unpaid:'Unpaid',payment:'Payment',exclusion:'Exclusion',match:'Co-funding'},
  mapTitle:'Notice map', mapHint:'Each bar is a line. Tall red bars are alerts. Click to read.', mapAria:'Map of {lines} lines with {alerts} alert lines', mapStats:'{lines} lines · {found} with findings · {alerts} alerts',
  navLabel:'Results sections', navSummary:'Summary', navAlerts:'Alerts', navGaps:'Questions', navReady:'Readiness', navLens:'Lens', navPoints:'Excerpts', navPlan:'Plan', deadlineDay:'Deadline day (from the notice)', briefSourceFile:'Source file', pagesWord:'pages', briefPagesNote:'text read in this browser'
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
  rangeClosing:'período: data de fecho lida como {date}', suggested:'SUGESTÃO',
  heroNoDeadlineBadge:'Prazo por confirmar', heroCloses:'Fecha a', heroToday:'Hoje', heroExample:'Exemplo fictício', heroPasted:'Texto colado',
  hlAlerts:'Alertas por tipo', hlReady:'Preparação', hlWindow:'Janela de trabalho', hlWindowStart:'Início', hlGaps:'Perguntas em aberto', hlNoGaps:'Nenhuma detetada', hlContact:'Contacto', hlNoContact:'Sem email detetado', noReadyShort:'sem checklist', moreAmounts:'+{n} no texto',
  windowBefore:'A preparação começa a {date}', windowInside:'Dia {n} de {total} da janela de trabalho',
  shortSignals:{rights:'Direitos',exclusivity:'Exclusivo',fee:'Taxa',unpaid:'Não pago',payment:'Pagamento',exclusion:'Exclusão',match:'Cofinanc.'},
  mapTitle:'Mapa do aviso', mapHint:'Cada barra é uma linha. As barras vermelhas altas são alertas. Clica para ler.', mapAria:'Mapa de {lines} linhas com {alerts} linhas de alerta', mapStats:'{lines} linhas · {found} com pontos · {alerts} alertas',
  navLabel:'Secções dos resultados', navSummary:'Resumo', navAlerts:'Alertas', navGaps:'Perguntas', navReady:'Preparação', navLens:'Lente', navPoints:'Excertos', navPlan:'Plano', deadlineDay:'Dia do prazo (lido do aviso)', briefSourceFile:'Ficheiro de origem', pagesWord:'páginas', briefPagesNote:'texto lido neste navegador'
});

Object.assign(copy.en, {
  shortlistTitle:'Shortlist', shortlistAdd:'Add this call', shortlistUpdate:'Update in shortlist', shortlistAdded:'Call added to the shortlist.', shortlistRemoved:'Call removed from the shortlist.', shortlistCsv:'Download CSV',
  shortlistEmpty:'Add calls as you review them to compare deadlines, alerts and readiness side by side.', shortlistNote:'Kept in this browser tab only. Reloading clears it; download the CSV to keep it.',
  sortLabel:'Sort shortlist', sortDeadline:'Soonest deadline', sortAlerts:'Most alerts', sortGaps:'Most open questions', sortReadiness:'Most ready',
  colCall:'Call', colDeadline:'Deadline', colDays:'Days left', colAmount:'Amount', colAlerts:'Alerts', colGaps:'Questions', colReadiness:'Readiness',
  statusRelative:'Relative', statusUnclear:'Unclear', statusNone:'Not found', statusPassed:'Passed', daysShort:'d', remove:'Remove', untitled:'Untitled call', navShortlist:'Shortlist',
  searchLabel:'Search the notice', searchPlaceholder:'Search the notice', searchPrev:'Previous match', searchNext:'Next match', searchNone:'No matches'
});
Object.assign(copy.pt, {
  shortlistTitle:'Lista de candidaturas', shortlistAdd:'Adicionar esta chamada', shortlistUpdate:'Atualizar na lista', shortlistAdded:'Chamada adicionada à lista.', shortlistRemoved:'Chamada removida da lista.', shortlistCsv:'Descarregar CSV',
  shortlistEmpty:'Junta as chamadas que fores revendo para comparar prazos, alertas e preparação lado a lado.', shortlistNote:'Fica só neste separador do navegador. Recarregar apaga a lista; descarrega o CSV para a guardar.',
  sortLabel:'Ordenar lista', sortDeadline:'Prazo mais próximo', sortAlerts:'Mais alertas', sortGaps:'Mais perguntas', sortReadiness:'Mais preparada',
  colCall:'Chamada', colDeadline:'Prazo', colDays:'Dias', colAmount:'Montante', colAlerts:'Alertas', colGaps:'Perguntas', colReadiness:'Preparação',
  statusRelative:'Relativo', statusUnclear:'Por confirmar', statusNone:'Não detetado', statusPassed:'Passou', daysShort:'d', remove:'Remover', untitled:'Chamada sem título', navShortlist:'Lista',
  searchLabel:'Pesquisar no aviso', searchPlaceholder:'Pesquisar no aviso', searchPrev:'Ocorrência anterior', searchNext:'Ocorrência seguinte', searchNone:'Sem resultados'
});

Object.assign(copy.en, {
  calendarTitle:'Notice calendar', calendarViewLabel:'Calendar view', calendarAll:'All dates', calendarFuture:'Upcoming only', calendarEmpty:'No explicit dates with a year were found apart from those already shown.', calendarNoFuture:'All dates in the notice have passed.', calendarNote:'Explicit dates only. Laws cited and sign-off dates are left out; dates without a year are never completed.',
  phases:{opening:'Opening',questions:'Questions',deadline:'Deadline',results:'Results',execution:'Project',payment:'Payment',report:'Report',other:'Other'},
  rulesTitle:'Submission rules', obligationsTitle:'If selected', rulesViewLabel:'Rules or obligations', rulesEmpty:'No length limits, file formats or language rules detected. Check the application form.', obligationsEmpty:'No obligations for selected applicants detected. Read the notice before accepting.',
  rulesNote:'Rules are also added to your readiness checklist.', obligationsNote:'What you commit to if the application succeeds.',
  obligationKinds:{report:'Report',credit:'Credit & publicity',delivery:'Delivery',refund:'Refund',other:'Commitment'},
  ruleMax:'Maximum', ruleMin:'Minimum', ruleFormats:'Formats', ruleLanguage:'Language', readyRules:'Rules to respect',
  units:{pages:'pages',characters:'characters',words:'words',minutes:'minutes',seconds:'seconds',images:'images',works:'works',files:'files',megabytes:'MB',gigabytes:'GB'},
  languages:{pt:'Portuguese',en:'English',es:'Spanish',fr:'French',kea:'Creole'}, navCalendar:'Calendar', navRules:'Rules'
});
Object.assign(copy.pt, {
  calendarTitle:'Calendário do aviso', calendarViewLabel:'Vista do calendário', calendarAll:'Todas as datas', calendarFuture:'Só próximas', calendarEmpty:'Não foram encontradas datas explícitas com ano além das já mostradas.', calendarNoFuture:'Todas as datas do aviso já passaram.', calendarNote:'Só datas explícitas. Leis citadas e datas de assinatura ficam de fora; datas sem ano nunca são completadas.',
  phases:{opening:'Abertura',questions:'Dúvidas',deadline:'Prazo',results:'Resultados',execution:'Projeto',payment:'Pagamento',report:'Relatório',other:'Outra'},
  rulesTitle:'Regras de submissão', obligationsTitle:'Se fores selecionado', rulesViewLabel:'Regras ou obrigações', rulesEmpty:'Não foram detetados limites, formatos ou regras de língua. Confirma no formulário de candidatura.', obligationsEmpty:'Não foram detetadas obrigações para selecionados. Lê o aviso antes de aceitar.',
  rulesNote:'As regras também entram na tua checklist de preparação.', obligationsNote:'O que te compromete se a candidatura for aprovada.',
  obligationKinds:{report:'Relatório',credit:'Menção e divulgação',delivery:'Entrega',refund:'Devolução',other:'Compromisso'},
  ruleMax:'Máximo', ruleMin:'Mínimo', ruleFormats:'Formatos', ruleLanguage:'Língua', readyRules:'Regras a cumprir',
  units:{pages:'páginas',characters:'caracteres',words:'palavras',minutes:'minutos',seconds:'segundos',images:'imagens',works:'obras',files:'ficheiros',megabytes:'MB',gigabytes:'GB'},
  languages:{pt:'português',en:'inglês',es:'espanhol',fr:'francês',kea:'crioulo'}, navCalendar:'Calendário', navRules:'Regras'
});

// Interface copy v4: shorter, quieter; explanations live in the "How to read" panel.
Object.assign(copy.en, {
  eyebrow:'For creators and small teams', heroDescription:'Turn a public call into a clearer plan. Review the source, spot clauses and prepare your next steps.',
  previewBadge:'Fictional example', previewOverline:'Opportunity snapshot', previewTitle:'Creative Futures Fund', previewDeadline:'Deadline', previewDate:'4 December 2026', previewRights:'Rights & licence', previewEvidence:'Read the original clause', previewPlan:'Your next steps', previewPlanNote:'Review and prepare a plan', previewFoot:'From source to action',
  workspaceEyebrow:'Workspace', urlLabel:'Official source link (optional)', urlHint:'Kept as a reference. Not fetched.', compareHint:'Textual differences, not legal conclusions.', pdfPrivacy:'PDFs are read in this browser. Nothing is uploaded.',
  reviewEyebrow:'Review', pointsFound:'excerpts', markedReviewed:'reviewed', openSource:'Original source', boardTitle:'Critical reading',
  infoTitle:'How to read these results', info1:'Every finding quotes the line it came from. Read it as a prompt, not a conclusion.', info2:'Nothing here decides eligibility. Readiness counts what you ticked.', info3:'“Not detected” means not found in the text you supplied, never that it does not exist.', info4:'Milestones are planning suggestions, not dates set by the organiser. Check the original deadline.',
  evidenceTitle:'Excerpts', evidenceHint:'Mark each one reviewed', lensHint:'Full text, line by line', noEvidence:'No matching excerpts. Check the source manually; absence here does not mean a requirement does not exist.',
  planStep:'Plan', planInitial:'Review in progress', planSmall:'Nothing is sent. Files are created on this device.',
  connectionLabel:'DUA Lab', connectionDescription:'An independent prototype exploring a future companion to DUA Radar Cultural. Not connected to DUA accounts or data.', footerText:'Independent Kiroween prototype', backToTop:'Back to top',
  statusReviewed:'Reviewed', statusRead:'Read from the text', statusMissing:'Not confirmed', daysAgo:'days since this date', contactFound:'Found',
  hlAlerts:'Alerts', alertViewLabel:'Alert view', byType:'By type', byPage:'By page', byPosition:'Across the text', legendFindings:'Findings', legendAlerts:'Alerts', tileSignals:'clauses to read carefully',
  hlReady:'Readiness', notEligibility:'Preparation only. Not an eligibility decision.', tileReady:'ready',
  countdownTitle:'Plan to the deadline', planLabel:'Working plan', planCompact:'2 weeks', planStandard:'3 weeks', planExtended:'6 weeks', suggestionsOnly:'Suggested milestones, not organiser dates.',
  mapTitle:'Notice map', mapAll:'All findings', mapFilterLabel:'Show on map', mapShown:'lines shown', mapLines:'lines',
  signalsTitle:'Alerts for creative work', gapsTitle:'Questions for the organiser', readyTitle:'Readiness checklist'
});
Object.assign(copy.pt, {
  eyebrow:'Para criadores e pequenas equipas', heroDescription:'Transforma uma chamada pública num plano mais claro. Revê a fonte, identifica cláusulas e prepara os próximos passos.',
  previewBadge:'Exemplo fictício', previewOverline:'Resumo da oportunidade', previewTitle:'Fundo Futuros Criativos', previewDeadline:'Prazo', previewDate:'4 de dezembro de 2026', previewRights:'Direitos e licença', previewEvidence:'Ler a cláusula original', previewPlan:'Próximos passos', previewPlanNote:'Rever e preparar um plano', previewFoot:'Da fonte à ação',
  workspaceEyebrow:'Espaço de trabalho', urlLabel:'Ligação à fonte oficial (opcional)', urlHint:'Fica como referência. Não é consultada.', compareHint:'Diferenças de texto, não conclusões jurídicas.', pdfPrivacy:'Os PDFs são lidos neste navegador. Nada é carregado.',
  reviewEyebrow:'Revisão', pointsFound:'excertos', markedReviewed:'revistos', openSource:'Fonte original', boardTitle:'Leitura crítica',
  infoTitle:'Como ler estes resultados', info1:'Cada ponto cita a linha de onde veio. Lê-o como pista, não como conclusão.', info2:'Nada aqui decide elegibilidade. A preparação conta o que marcaste.', info3:'“Não detetado” significa não encontrado no texto fornecido, nunca que não existe.', info4:'Os marcos são sugestões de planeamento, não datas da organização. Confirma o prazo original.',
  evidenceTitle:'Excertos', evidenceHint:'Marca cada um como revisto', lensHint:'Texto completo, linha a linha', noEvidence:'Sem excertos correspondentes. Confirma a fonte manualmente; a ausência aqui não significa que o requisito não exista.',
  planStep:'Plano', planInitial:'Revisão em curso', planSmall:'Nada é enviado. Os ficheiros são criados neste dispositivo.',
  connectionLabel:'DUA Lab', connectionDescription:'Protótipo independente que explora um futuro complemento ao Radar Cultural da DUA. Sem ligação a contas ou dados DUA.', footerText:'Protótipo independente Kiroween', backToTop:'Voltar ao início',
  statusReviewed:'Revisto', statusRead:'Lido do texto', statusMissing:'Por confirmar', daysAgo:'dias desde esta data', contactFound:'Encontrado',
  hlAlerts:'Alertas', alertViewLabel:'Vista dos alertas', byType:'Por tipo', byPage:'Por página', byPosition:'Ao longo do texto', legendFindings:'Pontos', legendAlerts:'Alertas', tileSignals:'cláusulas a ler com atenção',
  hlReady:'Preparação', notEligibility:'Só preparação. Não é decisão de elegibilidade.', tileReady:'pronto',
  countdownTitle:'Plano até ao prazo', planLabel:'Plano de trabalho', planCompact:'2 semanas', planStandard:'3 semanas', planExtended:'6 semanas', suggestionsOnly:'Marcos sugeridos, não datas da organização.',
  mapTitle:'Mapa do aviso', mapAll:'Todos os pontos', mapFilterLabel:'Mostrar no mapa', mapShown:'linhas em destaque', mapLines:'linhas',
  signalsTitle:'Alertas para criativos', gapsTitle:'Perguntas para a organização', readyTitle:'Checklist de preparação'
});

Object.assign(copy.en,{tooLong:'This text is longer than 150,000 characters. Split the notice or paste the relevant sections.'});
Object.assign(copy.pt,{tooLong:'Este texto tem mais de 150.000 caracteres. Divide o aviso ou cola as secções relevantes.'});

// Copy v5: one name per idea ("Questions" = questions for the organiser; "Export" = the files panel).
Object.assign(copy.en, {
  navPlan:'Export', planStep:'Export', confirmDeadline:'Confirm deadline', heroCloses:'Date to verify:',
  planCalendarLocked:'Confirm the deadline (in the summary card or its excerpt) to unlock the calendar.'
});
copy.en.phases={...copy.en.phases,questions:'Clarifications'};
Object.assign(copy.pt, {
  navPlan:'Exportar', planStep:'Exportar', confirmDeadline:'Confirmar prazo', heroCloses:'Data a verificar:',
  planCalendarLocked:'Confirma o prazo (no cartão de resumo ou no excerto) para desbloquear o calendário.'
});
copy.pt.phases={...copy.pt.phases,questions:'Esclarecimentos'};

const $ = (selector) => document.querySelector(selector);
const nodes = {form:$('#sourceForm'), text:$('#sourceText'), url:$('#sourceUrl'), previous:$('#previousText'), count:$('#sourceCount'), error:$('#formError'), results:$('#results'), list:$('#evidenceList'), empty:$('#emptyEvidence'), changesSection:$('#changesSection'), changes:$('#changesList'), link:$('#sourceLink'), announcement:$('#announcement')};
let language='en';
let current=null;
let sampleLoaded=false;
let reviewed=new Set();
let notes=new Map();
let ready=new Set();
let pdfInfo=null;
let pdfMessage=null;
let stateKey=null;
let planKey='standard';
let alertView='type';
let mapFilter='all';
let shortlist=[];
let shortlistSort='deadline';
let searchHits=[];
let searchIndex=-1;
let calendarView='all';
let rulesView='rules';
let changesFilter='all';

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
  document.querySelectorAll('[data-i18n-aria]').forEach((node)=>{if(t[node.dataset.i18nAria]) node.setAttribute('aria-label',t[node.dataset.i18nAria])});
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

// Hides stale results. Review state (reviewed, notes, ready) is kept and reused if the same text is analysed again.
function clearResults() {
  current=null; nodes.results.hidden=true; changesFilter='all';
}

// Keeps review state for the same text (filtered to ids that still exist); starts fresh for a different text.
function restoreState(key) {
  if(key!==stateKey){ reviewed=new Set(); notes=new Map(); ready=new Set(); stateKey=key; return; }
  const validIds=new Set((current.items||[]).map((item)=>String(item.id)));
  reviewed=new Set([...reviewed].filter((id)=>validIds.has(id)));
  notes=new Map([...notes].filter(([id])=>validIds.has(id)));
  const validReady=new Set((current.checklist||[]).map((entry)=>entry.id));
  ready=new Set([...ready].filter((id)=>validReady.has(id)));
}

function safeUrl(value) {
  if(!value.trim()) return '';
  try { const url=new URL(value); return ['https:','http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}

function runAnalysis(event) {
  event?.preventDefault();
  nodes.error.textContent='';
  if(!nodes.text.value.trim()) {nodes.error.textContent=copy[language].enterText; nodes.text.focus(); return;}
  if(nodes.text.value.length>MAX_TEXT_LENGTH || nodes.previous.value.length>MAX_TEXT_LENGTH) {nodes.error.textContent=copy[language].tooLong; nodes.text.focus(); return;}
  const url=safeUrl(nodes.url.value);
  if(url===null) {nodes.error.textContent=copy[language].badUrl; nodes.url.focus(); return;}
  try { current=analyse({text:nodes.text.value, previousText:nodes.previous.value, url}); }
  catch { clearResults(); nodes.error.textContent=copy[language].analysisError; return; }
  current.example=sampleLoaded;
  attachInsights(current, nodes.text.value);
  current.pages=validPageMap();
  restoreState(textKey(nodes.text.value));
  nodes.results.hidden=false;
  renderResults();
  nodes.results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  nodes.results.focus({preventScroll:true});
}

function attachInsights(result,text) {
  const items=Array.isArray(result.items)?result.items:[];
  result.signals=detectSignals(text);
  result.amounts=findAmounts(text);
  result.gaps=findGaps(text,items,result.signals,result.amounts);
  result.deadlines=explicitDeadlines(items);
  result.calendar=noticeCalendar(text,result.deadlines);
  result.rules=submissionRules(text);
  result.obligations=obligations(text);
  // Submission rules join the checklist; their wording is rendered in the current language.
  result.checklist=[...buildChecklist(items),...rulesChecklist(result.rules,()=>'').map((entry,index)=>({...entry,rule:result.rules[index]}))];
  result.addedLines=new Set((result.changes||[]).filter((change)=>change.kind==='added').map((change)=>change.quote.trim()));
}

function formatDay(iso,options={day:'numeric',month:'short'}) {
  const locale=language==='pt'?'pt-PT':'en-GB';
  const date=new Date(`${iso}T00:00:00Z`);
  // pt-PT renders a short day and month as "13/11"; spell the month instead ("13 nov").
  if(options.month==='short') {
    const month=new Intl.DateTimeFormat(locale,{month:'short',timeZone:'UTC'}).format(date).replace('.','');
    return `${date.getUTCDate()} ${month}${options.year?` ${date.getUTCFullYear()}`:''}`;
  }
  return new Intl.DateTimeFormat(locale,{...options,timeZone:'UTC'}).format(date);
}

function countdownState() {
  const deadline=current.deadlines?.[0];
  if(!deadline) return null;
  return {deadline,countdown:buildCountdown({iso:deadline.date.iso,today:localIsoDay(),plan:planKey}),reviewed:reviewed.has(String(deadline.id))};
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
  const lens=$('#lens'); if(lens && !lens.open) lens.open=true;
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
    } else row.tabIndex=-1;
    if(marks.length){
      row.addEventListener('click',()=>jumpToFinding(n));
      row.addEventListener('keydown',(event)=>{ if(event.key==='Enter'||event.key===' '){ event.preventDefault(); jumpToFinding(n); } });
    }
    fragment.append(row);
  });
  body.append(fragment);
  applySearch();
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
  if(pdfMessage?.type==='busy') { status.hidden=false; status.className='pdf-status is-busy'; status.textContent=t.pdfReading; return; }
  if(pdfMessage?.type==='error') { status.hidden=false; status.className='pdf-status is-error'; status.textContent=t.pdfError[pdfMessage.code]||t.pdfError.unreadable; return; }
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
  pdfMessage={type:'busy'}; renderPdfStatus();
  try {
    const result=await readPdfFile(file);
    nodes.text.value=result.text;
    nodes.count.textContent=String(result.text.length);
    sampleLoaded=false; nodes.error.textContent=''; clearResults();
    if(isSamplePrevious(nodes.previous.value)) nodes.previous.value='';
    pdfMessage=null;
    pdfInfo={name:result.name,pages:result.pages,lineCount:result.lineCount,pageCount:result.pageCount,pagesRead:result.pagesRead,truncated:result.truncated,truncatedAtPage:result.truncatedAtPage,emptyPages:result.emptyPages};
    renderPdfStatus();
    nodes.announcement.textContent=status.textContent;
    nodes.text.focus();
  } catch(error) {
    // The previous text, results and page map stay as they were.
    pdfMessage={type:'error',code:error?.code};
    renderPdfStatus();
    nodes.announcement.textContent=status.textContent;
  }
}

const SVG_NS='http://www.w3.org/2000/svg';
function svg(tag,attrs={},children=[]) {
  const node=document.createElementNS(SVG_NS,tag);
  for(const [key,value] of Object.entries(attrs)) node.setAttribute(key,String(value));
  for(const child of children) node.append(child);
  return node;
}
function svgText(x,y,text,className,anchor='start') {
  return svg('text',{x,y,class:className,'text-anchor':anchor},[document.createTextNode(text)]);
}
function dayDiff(a,b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`)-Date.parse(`${a}T00:00:00Z`))/86400000);
}

function renderShortlist() {
  const t=copy[language];
  const card=$('#shortlist'); if(!card) return;
  card.replaceChildren();
  const head=element('div','card-head');
  const h=element('h4','',t.shortlistTitle); h.id='shortlist-title';
  head.append(h,element('span','card-meta',shortlist.length?`${shortlist.length}`:''));
  card.append(head);
  const tools=element('div','shortlist-tools');
  const inList=current && shortlist.some((entry)=>entry.key===textKey(nodes.text.value));
  const add=element('button','button button-light button-sm',inList?t.shortlistUpdate:t.shortlistAdd); add.type='button'; add.id='shortlistAdd';
  add.disabled=!current;
  add.addEventListener('click',()=>{ if(!current) return; shortlist=upsert(shortlist,currentSummary()); renderShortlist(); nodes.announcement.textContent=t.shortlistAdded; $('#shortlistAdd')?.focus(); });
  tools.append(add);
  if(shortlist.length){
    tools.append(selectControl('shortlistSort',t.sortLabel,[['deadline',t.sortDeadline],['alerts',t.sortAlerts],['gaps',t.sortGaps],['readiness',t.sortReadiness]],shortlistSort,(value)=>{shortlistSort=value;renderShortlist();}));
    const csv=element('button','button button-outline button-sm',t.shortlistCsv); csv.type='button'; csv.id='shortlistCsv';
    csv.addEventListener('click',()=>downloadFile(toCsv(sortEntries(shortlist,shortlistSort),{title:t.colCall,deadline:t.colDeadline,daysLeft:t.colDays,amount:t.colAmount,alerts:t.colAlerts,gaps:t.colGaps,readiness:t.colReadiness,example:t.heroExample,status:{explicit:'',relative:t.statusRelative,unclear:t.statusUnclear,none:t.statusNone}}),'text/csv;charset=utf-8','opportunity-shortlist.csv'));
    tools.append(csv);
  }
  card.append(tools);
  if(!shortlist.length){ card.append(element('p','card-empty',t.shortlistEmpty)); return; }
  const entries=sortEntries(shortlist,shortlistSort);
  const today=localIsoDay();
  const horizon=Math.max(28,...entries.filter((e)=>e.daysLeft!==null&&e.daysLeft>=0).map((e)=>e.daysLeft));
  const scale=element('div','gantt-scale');
  const ticks=4;
  for(let i=0;i<=ticks;i++){ const d=Math.round(horizon*i/ticks); const tick=element('span','',i===0?t.heroToday:`+${d} ${t.daysShort}`); tick.style.left=`${i/ticks*100}%`; scale.append(tick); }
  const gantt=element('div','gantt'); gantt.setAttribute('role','list'); gantt.setAttribute('aria-label',t.shortlistTitle);
  const scaleTrack=element('div','gantt-track'); scaleTrack.append(scale,element('span','gantt-label',''));
  const scaleRow=element('div','gantt-row is-scale'); scaleRow.append(element('span','gantt-title',''),scaleTrack); gantt.append(scaleRow);
  const currentKey=current?textKey(nodes.text.value):null;
  const status=(entry)=>entry.deadline?(entry.daysLeft<0?t.statusPassed:`${entry.daysLeft} ${t.daysShort}`):({relative:t.statusRelative,unclear:t.statusUnclear,none:t.statusNone})[entry.deadlineStatus];
  for(const entry of entries){
    const row=element('div',`gantt-row${entry.key===currentKey?' is-current':''}`); row.setAttribute('role','listitem');
    row.append(element('span','gantt-title',entry.title));
    const track=element('div','gantt-track');
    const area=element('div','gantt-area');
    if(entry.deadline && entry.daysLeft>=0){
      const bar=element('span','gantt-bar'); bar.style.width=`${Math.max(1.5,entry.daysLeft/horizon*100)}%`;
      const dot=element('span','gantt-dot'); dot.style.left=`${entry.daysLeft/horizon*100}%`;
      area.append(bar,dot);
    } else { track.classList.add('is-undated'); area.append(element('span','gantt-undated',status(entry))); }
    track.append(area,element('span','gantt-label',entry.deadline?status(entry):'—'));
    row.append(track);
    gantt.append(row);
  }
  card.append(gantt);
  const table=element('table','shortlist-table');
  const thead=element('thead'); const hr=element('tr');
  for(const label of [t.colCall,t.colDeadline,t.colAmount,t.colAlerts,t.colGaps,t.colReadiness,'']) { const th=element('th','',label); th.scope='col'; hr.append(th); }
  thead.append(hr); table.append(thead);
  const tbody=element('tbody');
  for(const entry of entries){
    const tr=element('tr',entry.key===currentKey?'is-current':'');
    const cell=(label,value,className='')=>{const td=element('td',className,value);td.dataset.label=label;tr.append(td);};
    cell(t.colCall,entry.title+(entry.example?` · ${t.heroExample}`:''),'col-title');
    cell(t.colDeadline,entry.deadline?formatDay(entry.deadline,{day:'numeric',month:'short',year:'numeric'}):status(entry));
    cell(t.colAmount,entry.amount||'—');
    cell(t.colAlerts,String(entry.alerts),entry.alerts?'is-flag':'');
    cell(t.colGaps,String(entry.gaps));
    cell(t.colReadiness,entry.readiness===null?'—':`${entry.readiness}%`);
    const td=element('td','col-action'); const remove=element('button','text-action',t.remove); remove.type='button';
    remove.setAttribute('aria-label',`${t.remove}: ${entry.title}`);
    remove.addEventListener('click',()=>{ shortlist=shortlist.filter((existing)=>existing.key!==entry.key); renderShortlist(); nodes.announcement.textContent=t.shortlistRemoved; $('#shortlistAdd')?.focus(); });
    td.append(remove); tr.append(td);
    tbody.append(tr);
  }
  table.append(tbody);
  const wrap=element('div','table-wrap'); wrap.append(table);
  card.append(wrap,element('p','card-foot',t.shortlistNote));
}

// Lens search: accent- and case-insensitive, highlights matches and steps through them.
function normalizeWithMap(text) {
  let normalized=''; const map=[];
  for(let i=0;i<text.length;i++){ const plain=text[i].normalize('NFD').replace(/\p{M}/gu,'').toLowerCase(); for(const ch of plain){ normalized+=ch; map.push(i); } }
  return {normalized,map};
}

function applySearch(step=0) {
  const t=copy[language];
  const input=$('#lensQuery'); const count=$('#lensCount');
  if(!input||!count) return;
  const query=input.value.trim().normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  for(const row of document.querySelectorAll('#lensBody .lens-line')){
    const text=row.querySelector('.lens-text');
    if(text.dataset.raw===undefined) text.dataset.raw=text.textContent;
    const raw=text.dataset.raw;
    text.replaceChildren(document.createTextNode(raw));
    row.classList.remove('is-match');
    if(query.length<2) continue;
    const {normalized,map}=normalizeWithMap(raw);
    let from=0, index, last=0; const parts=[];
    while((index=normalized.indexOf(query,from))!==-1){
      const start=map[index], end=map[index+query.length-1]+1;
      if(start>last) parts.push(document.createTextNode(raw.slice(last,start)));
      parts.push(element('mark','lens-mark',raw.slice(start,end)));
      last=end; from=index+query.length;
    }
    if(parts.length){ if(last<raw.length) parts.push(document.createTextNode(raw.slice(last))); text.replaceChildren(...parts); row.classList.add('is-match'); }
  }
  searchHits=[...document.querySelectorAll('#lensBody .lens-mark')];
  if(!searchHits.length){ searchIndex=-1; count.textContent=query.length>=2?t.searchNone:''; return; }
  searchIndex=step===0?0:(searchIndex+step+searchHits.length)%searchHits.length;
  searchHits.forEach((mark,i)=>mark.classList.toggle('is-current',i===searchIndex));
  count.textContent=`${searchIndex+1} / ${searchHits.length}`;
  if(step!==0||document.activeElement===input){ const lens=$('#lens'); if(lens&&!lens.open) lens.open=true; const mark=searchHits[searchIndex]; const body=$('#lensBody'); body.scrollTo({top:Math.max(0,mark.closest('.lens-line').offsetTop-body.clientHeight/2),behavior:motion()}); }
}

// A native <select>, styled, so keyboard and screen readers work everywhere.
function selectControl(id,label,options,value,onChange) {
  const wrap=element('label','select');
  wrap.append(element('span','sr-only',label));
  const select=element('select'); select.id=id;
  for(const [optionValue,text] of options){ const option=element('option','',text); option.value=optionValue; option.selected=optionValue===value; select.append(option); }
  select.addEventListener('change',()=>{ onChange(select.value); document.getElementById(id)?.focus(); });
  wrap.append(select);
  return wrap;
}

// Cards are <article> (fixed) or <details> (foldable). Controls never sit inside <summary>.
function cardHeader(card,id,title,meta='',control=null) {
  if(card.tagName==='DETAILS'){
    const summary=element('summary','fold-summary');
    const heading=element('span','fold-title',title); heading.id=id;
    summary.append(heading,element('span','fold-meta',meta));
    card.replaceChildren(summary);
    if(control){ const tools=element('div','card-tools'); tools.append(control); card.append(tools); }
    return;
  }
  const head=element('div','card-head');
  const heading=element('h4','',title); heading.id=id;
  head.append(heading,control||element('span','card-meta',meta));
  card.replaceChildren(head);
}

function renderDashboard({state,total,done,percent,signalCount}) {
  const t=copy[language];
  const long={day:'numeric',month:'long',year:'numeric'};

  // Deadline hero
  const hero=$('#snapshot'); hero.replaceChildren();
  const relative=current.gaps.includes('deadlineRelative');
  hero.className=`dash-hero${!state?' is-empty':state.countdown.passed?' is-warning':''}`;
  const top=element('div','hero-top');
  top.append(element('span','hero-label',t.categories.deadline));
  if(state){
    // Confirming here reviews the deadline excerpt and unlocks the calendars.
    const confirm=element('button',`hero-status hero-confirm${state.reviewed?' is-reviewed':''}`,state.reviewed?t.statusReviewed:t.confirmDeadline);
    confirm.type='button'; confirm.id='heroConfirm'; confirm.setAttribute('aria-pressed',String(state.reviewed));
    confirm.addEventListener('click',()=>{
      const ids=(current.items||[]).filter((item)=>item.line===state.deadline.line).map((item)=>String(item.id));
      setReviewed(ids,!state.reviewed);
      renderResults();
      $('#heroConfirm')?.focus();
      nodes.announcement.textContent=state.reviewed?t.notReviewed:t.reviewed;
    });
    top.append(confirm);
  } else top.append(element('span','hero-status',t.statusMissing));
  hero.append(top);
  const big=element('div','hero-big');
  if(!state) big.append(element('strong','hero-number','—'),element('span','hero-unit',relative?t.gapNames.deadlineRelative:t.tileNoDeadline));
  else if(state.countdown.passed) big.append(element('strong','hero-number',String(Math.abs(state.countdown.daysLeft))),element('span','hero-unit',t.daysAgo));
  else big.append(element('strong','hero-number',String(state.countdown.daysLeft)),element('span','hero-unit',state.countdown.daysLeft===1?t.tileDaysOne:state.countdown.daysLeft===0?t.tileToday:t.tileDays));
  hero.append(big);
  hero.append(element('p','hero-condition',state?`${t.heroCloses} ${formatDay(state.deadline.date.iso,long)}`:(relative?t.gapQuestions.deadlineRelative:t.noCountdown)));
  const stats=element('dl','hero-stats');
  const stat=(label,value,flag=false)=>{const row=element('div',`hero-stat${flag?' is-flag':''}`);row.append(element('dt','',label),element('dd','',value));stats.append(row);};
  stat(t.tileAmount,current.amounts[0]?.raw||'—',!current.amounts.length);
  stat(t.hlGaps,String(current.gaps.length),current.gaps.length>0);
  const email=findContactEmails(nodes.text.value)[0];
  stat(t.hlContact,email?t.contactFound:'—',!email);
  hero.append(stats);
  const sourceName=pdfInfo?.name || (current.sourceUrl?new URL(current.sourceUrl).hostname:(current.example?t.heroExample:t.heroPasted));
  hero.append(element('p','hero-foot',`${sourceName} · ${t.heroToday} ${formatDay(localIsoDay(),long)}`));

  const box=$('#highlights'); box.replaceChildren();
  box.append(renderAlertChart(signalCount),renderReadinessRing({total,done,percent}));
  renderCountdownCard(state);
  renderDocMap();
  renderNoticeCalendar();
  renderRulesCard();
  renderSectionNav();
}

function textBins() {
  const lineCount=nodes.text.value.split('\n').length;
  const pages=current.pages||[];
  if(pages.length>1) return pages.map((start,index)=>({label:`${copy[language].pageShort} ${index+1}`,from:start,to:(pages[index+1]||lineCount+1)-1}));
  const size=Math.max(1,Math.ceil(lineCount/10));
  const bins=[];
  for(let from=1;from<=lineCount;from+=size) bins.push({label:`${Math.round((from-1)/lineCount*100)}%`,from,to:Math.min(lineCount,from+size-1)});
  return bins;
}

function renderAlertChart(signalCount) {
  const t=copy[language];
  const card=element('article','card hl-alerts');
  const control=selectControl('alertView',t.alertViewLabel,[['type',t.byType],['position',current.pages?.length>1?t.byPage:t.byPosition]],alertView,(value)=>{alertView=value;renderBoard();});
  const head=element('div','card-head'); const h=element('h4','',t.hlAlerts); h.id='alerts-title'; head.append(h,control);
  card.append(head);
  const total=element('div','metric'); total.append(element('strong','',String(signalCount)),element('span','',t.tileSignals));
  card.append(total);
  const firm=(current.signals||[]).filter((signal)=>!signal.unspecified);
  if(alertView==='type'){
    const counts={}; for(const signal of firm) counts[signal.kind]=(counts[signal.kind]||0)+1;
    const kinds=Object.keys(t.signalNames).sort((a,b)=>(counts[b]||0)-(counts[a]||0));
    const max=Math.max(1,...Object.values(counts));
    const list=element('ul','hbars'); list.setAttribute('aria-label',t.hlAlerts);
    kinds.forEach((kind,index)=>{
      const n=counts[kind]||0;
      const row=element('li',`hbar${n?'':' is-zero'}${index===0&&n?' is-top':''}`);
      const track=element('span','hbar-track'); const fill=element('span','hbar-fill'); fill.style.width=`${n/max*100}%`; track.append(fill);
      const label=element('span','hbar-label'); label.title=t.signalNames[kind];
      label.append(element('span','label-full',t.signalNames[kind]),element('span','label-short',t.shortSignals[kind]));
      row.append(label,track,element('span','hbar-value',String(n)));
      list.append(row);
    });
    card.append(list);
  } else {
    const bins=textBins();
    const findings=bins.map((bin)=>new Set((current.items||[]).filter((item)=>item.line>=bin.from&&item.line<=bin.to).map((item)=>item.line)).size);
    const alerts=bins.map((bin)=>firm.filter((signal)=>signal.line>=bin.from&&signal.line<=bin.to).length);
    const max=Math.max(1,...findings.map((n,i)=>Math.max(n,alerts[i])));
    const W=300,H=130,base=108,step=W/bins.length,bw=Math.min(22,step*0.5);
    const chart=svg('svg',{viewBox:`0 0 ${W} ${H}`,class:'colchart',role:'img','aria-label':bins.map((bin,i)=>`${bin.label}: ${findings[i]} / ${alerts[i]}`).join(', ')});
    for(let g=0;g<=2;g++){ const y=base-(base-14)*g/2; chart.append(svg('line',{x1:0,x2:W,y1:y,y2:y,class:'grid'})); }
    bins.forEach((bin,i)=>{
      const x=i*step+(step-bw)/2;
      const hf=(base-14)*findings[i]/max, ha=(base-14)*alerts[i]/max;
      chart.append(svg('rect',{x,y:base-hf,width:bw,height:Math.max(hf,1),rx:2,class:'col-findings'}));
      if(alerts[i]) chart.append(svg('rect',{x:x+bw*0.25,y:base-ha,width:bw*0.5,height:ha,rx:1.5,class:'col-alerts'}));
      if(bins.length<=12 || i%Math.ceil(bins.length/12)===0) chart.append(svgText(x+bw/2,H-6,bin.label,'axis','middle'));
    });
    const legend=element('div','legend'); legend.append(element('span','key key-muted',t.legendFindings),element('span','key key-accent',t.legendAlerts));
    card.append(chart,legend);
  }
  return card;
}

function renderReadinessRing({total,done,percent}) {
  const t=copy[language];
  const card=element('article','card hl-ready');
  const head=element('div','card-head'); head.append(element('h4','',t.hlReady),element('span','card-meta',total?`${done}/${total}`:''));
  card.append(head);
  const r=46, c=2*Math.PI*r;
  const ring=svg('svg',{viewBox:'0 0 120 120',class:'ring','aria-hidden':'true'},[
    svg('circle',{cx:60,cy:60,r,class:'ring-track'}),
    svg('circle',{cx:60,cy:60,r,class:'ring-fill','stroke-dasharray':`${c*percent/100} ${c}`,transform:'rotate(-90 60 60)'})
  ]);
  for(let i=0;i<total&&total<=40;i++){ const a=(i/total)*2*Math.PI-Math.PI/2; ring.append(svg('circle',{cx:60+57*Math.cos(a),cy:60+57*Math.sin(a),r:1.6,class:`ring-dot${i<done?' is-on':''}`})); }
  const wrap=element('div','ring-wrap'); wrap.setAttribute('role','img'); wrap.setAttribute('aria-label',`${t.hlReady}: ${percent}%`);
  const value=element('div','ring-value'); value.append(element('strong','',total?`${percent}%`:'—'),element('span','',total?t.tileReady:t.noReadyShort));
  wrap.append(ring,value);
  card.append(wrap,element('p','card-foot',t.notEligibility));
  return card;
}

function renderCountdownCard(state) {
  const t=copy[language];
  const card=$('#countdownCard');
  const control=state&&!state.countdown.passed?selectControl('planSelect',t.planLabel,[['compact',t.planCompact],['standard',t.planStandard],['extended',t.planExtended]],planKey,(value)=>{planKey=value;renderBoard();renderKit();}):null;
  cardHeader(card,'countdown-title',t.countdownTitle,state?formatDay(state.deadline.date.iso,{day:'numeric',month:'long',year:'numeric'}):'',control);
  if(!state){ card.append(element('p','card-empty',t.noCountdown)); return; }
  if(current.deadlines.length>1) card.append(element('p','card-note',t.countdownMultiple));
  if(state.countdown.passed){ card.append(element('p','card-empty',t.countdownPassed)); return; }
  const today=localIsoDay();
  const first=state.countdown.milestones[0].iso;
  const start=dayDiff(first,today)<0?first:today;
  const span=Math.max(1,dayDiff(first,state.deadline.date.iso));
  const W=320,H=64,pad=10,y=30;
  const x=(iso)=>pad+(W-2*pad)*Math.min(1,Math.max(0,dayDiff(first,iso)/span));
  const line=svg('svg',{viewBox:`0 0 ${W} ${H}`,class:'timeline',role:'img','aria-label':`${t.countdownTitle}: ${state.countdown.daysLeft} ${t.tileDays}`});
  line.append(svg('line',{x1:pad,x2:W-pad,y1:y,y2:y,class:'tl-track'}));
  line.append(svg('line',{x1:pad,x2:x(today),y1:y,y2:y,class:'tl-done'}));
  state.countdown.milestones.forEach((m,i)=>{ line.append(svg('circle',{cx:x(m.iso),cy:y,r:4,class:`tl-mark${m.past?' is-past':''}`})); line.append(svgText(x(m.iso),y-12,`D−${m.offset}`,'tl-label','middle')); if(i===0) line.append(svgText(x(m.iso),y+24,formatDay(m.iso),'tl-date','start')); });
  line.append(svg('circle',{cx:x(state.deadline.date.iso),cy:y,r:6,class:'tl-end'}));
  line.append(svgText(x(state.deadline.date.iso),y+24,formatDay(state.deadline.date.iso),'tl-date','end'));
  if(dayDiff(first,today)>=0) line.append(svg('line',{x1:x(today),x2:x(today),y1:y-9,y2:y+9,class:'tl-today'}));
  card.append(line);
  const list=element('ol','milestones');
  for(const m of state.countdown.milestones){
    const row=element('li',`milestone${m.past?' is-past':''}`);
    row.append(element('span','milestone-date',formatDay(m.iso)),element('span','milestone-label',t.milestones[m.key]),element('span','milestone-offset',m.past?t.milestonePast:`D−${m.offset}`));
    list.append(row);
  }
  const end=element('li','milestone is-deadline');
  end.append(element('span','milestone-date',formatDay(state.deadline.date.iso)),element('span','milestone-label',t.categories.deadline),element('span','milestone-offset','D'));
  list.append(end);
  card.append(list,element('p','card-foot',dayDiff(start,today)<0?t.windowBefore.replace('{date}',formatDay(first)):t.suggestionsOnly));
}

function renderDocMap() {
  const t=copy[language];
  const card=$('#docMap');
  const filters=[['all',t.mapAll],['alert',t.lensAlert],['deadline',t.categories.deadline],['eligibility',t.categories.eligibility],['documents',t.categories.documents],['costs',t.categories.costs],['funding',t.categories.funding]];
  cardHeader(card,'map-title',t.mapTitle,'',selectControl('mapFilter',t.mapFilterLabel,filters,mapFilter,(value)=>{mapFilter=value;renderDocMap();}));
  const lines=nodes.text.value.split('\n');
  const n=lines.length;
  const byLine=new Map();
  for(const item of current.items||[]){ if(!byLine.has(item.line)) byLine.set(item.line,new Set()); byLine.get(item.line).add(item.category); }
  const alertLines=new Set((current.signals||[]).filter((signal)=>!signal.unspecified).map((signal)=>signal.line));
  const matches=(line)=>mapFilter==='all'?(byLine.has(line)||alertLines.has(line)):mapFilter==='alert'?alertLines.has(line):byLine.get(line)?.has(mapFilter);
  const W=1000,H=112,base=90;
  const step=W/Math.max(n,1);
  let shown=0;
  const map=svg('svg',{viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:'none',class:'map-svg',role:'img','aria-label':t.mapAria.replace('{lines}',String(n)).replace('{alerts}',String(alertLines.size))});
  for(let g=1;g<=3;g++) map.append(svg('line',{x1:0,x2:W,y1:base-g*22,y2:base-g*22,class:'grid'}));
  lines.forEach((raw,index)=>{
    const lineNo=index+1, len=raw.trim().length;
    if(!len) return;
    const hit=matches(lineNo); if(hit) shown+=1;
    const found=byLine.has(lineNo)||alertLines.has(lineNo);
    const h=alertLines.has(lineNo)?base-10:Math.max(5,Math.min(1,len/120)*(found?60:34));
    const width=Math.min(Math.max(step*0.7,1.2),12);
    map.append(svg('rect',{x:(index*step+(step-width)/2).toFixed(2),y:(base-h).toFixed(2),width:width.toFixed(2),height:h.toFixed(2),rx:Math.min(2,width/3).toFixed(2),class:`map-bar${hit?' is-hit':''}${alertLines.has(lineNo)?' is-alert':''}`}));
  });
  map.append(svg('line',{x1:0,y1:base+1,x2:W,y2:base+1,class:'map-base'}));
  const pages=current.pages||[];
  if(pages.length>1) pages.forEach((start,index)=>{ const px=(start-1)*step; map.append(svg('line',{x1:px,y1:base+1,x2:px,y2:H,class:'map-page'})); map.append(svgText(px+5,H-5,`${t.pageShort} ${index+1}`,'map-page-label')); });
  map.addEventListener('click',(event)=>{
    const rect=map.getBoundingClientRect();
    const line=Math.min(n,Math.max(1,Math.floor((event.clientX-rect.left)/rect.width*n)+1));
    let target=line;
    for(let d=0;d<8;d++){ if(matches(line+d)){target=line+d;break;} if(matches(line-d)){target=line-d;break;} }
    const lens=$('#lens'); if(lens && !lens.open) lens.open=true;
    focusLens(target);
  });
  // Keyboard: Enter or Space opens the lens on the first line that matches the filter.
  map.tabIndex=0;
  map.addEventListener('keydown',(event)=>{
    if(event.key!=='Enter' && event.key!==' ') return;
    event.preventDefault();
    let first=0; for(let line=1;line<=n;line++) if(matches(line)){first=line;break;}
    if(!first) return;
    const lens=$('#lens'); if(lens && !lens.open) lens.open=true;
    focusLens(first);
  });
  const legend=element('div','legend');
  legend.append(element('span','key key-accent',`${shown} ${t.mapShown}`),element('span','key key-muted',`${n} ${t.mapLines}`));
  card.append(map,legend);
}

function quoteRow(className,tagText,quote,line,extra=null) {
  const row=element('li',className);
  const head=element('div','row-head');
  head.append(element('span','row-tag',tagText));
  if(extra) head.append(extra);
  const badge=pageBadge(line); if(badge) head.append(badge);
  row.append(head,element('p','row-quote',quote),lineLink(line));
  return row;
}

function renderNoticeCalendar() {
  const t=copy[language];
  const card=$('#noticeCalendar');
  const today=localIsoDay();
  const all=current.calendar||[];
  const control=all.length?selectControl('calendarView',t.calendarViewLabel,[['all',t.calendarAll],['future',t.calendarFuture]],calendarView,(value)=>{calendarView=value;renderNoticeCalendar();}):null;
  cardHeader(card,'calendar-title',t.calendarTitle,all.length?String(all.length):'',control);
  const events=calendarView==='future'?all.filter((event)=>(event.endIso||event.iso)>=today):all;
  if(!events.length){ card.append(element('p','card-empty',all.length?t.calendarNoFuture:t.calendarEmpty)); return; }
  const first=[...events.map((e)=>e.iso),today].sort()[0];
  const last=[...events.map((e)=>e.endIso||e.iso),today].sort().at(-1);
  const span=Math.max(1,dayDiff(first,last));
  // Drawn at the card's scale so labels stay readable on phones.
  const W=matchMedia('(max-width:700px)').matches?340:640,H=86,pad=14,y=50;
  const x=(iso)=>pad+(W-2*pad)*Math.min(1,Math.max(0,dayDiff(first,iso)/span));
  const chart=svg('svg',{viewBox:`0 0 ${W} ${H}`,class:'cal-chart',role:'img','aria-label':events.map((e)=>`${t.phases[e.phase]} ${e.iso}`).join(', ')});
  chart.append(svg('line',{x1:pad,x2:W-pad,y1:y,y2:y,class:'tl-track'}));
  // Month ticks
  const start=new Date(`${first}T00:00:00Z`); start.setUTCDate(1);
  for(let d=new Date(start);d.toISOString().slice(0,10)<=last;d.setUTCMonth(d.getUTCMonth()+1)){
    const iso=d.toISOString().slice(0,10); if(iso<first) continue;
    const px=x(iso); chart.append(svg('line',{x1:px,x2:px,y1:y-4,y2:y+4,class:'cal-tick'}));
    chart.append(svgText(px,H-6,new Intl.DateTimeFormat(language==='pt'?'pt-PT':'en-GB',{month:'short',timeZone:'UTC'}).format(d).replace('.',''),'cal-month','middle'));
  }
  let lane=0;
  for(const event of events){
    const cls=`cal-${event.phase}`;
    if(event.endIso) chart.append(svg('rect',{x:x(event.iso),y:y-3,width:Math.max(3,x(event.endIso)-x(event.iso)),height:6,rx:3,class:`cal-period ${cls}`}));
    const px=x(event.endIso||event.iso);
    chart.append(svg('circle',{cx:px,cy:y,r:event.phase==='deadline'?6:4,class:`cal-dot ${cls}`}));
    lane=(lane+1)%2;
    const anchor=px<70?'start':px>W-70?'end':'middle';
    chart.append(svgText(px,lane?y-14:y-26,t.phases[event.phase],`cal-label ${cls}`,anchor));
  }
  if(today>=first && today<=last){ const px=x(today); chart.append(svg('line',{x1:px,x2:px,y1:y-34,y2:y+10,class:'cal-today'})); }
  card.append(chart);
  const list=element('ul','row-list');
  for(const event of events){
    const date=element('span','row-date',`${formatDay(event.iso,{day:'numeric',month:'short',year:'numeric'})}${event.endIso?` → ${formatDay(event.endIso,{day:'numeric',month:'short',year:'numeric'})}`:''}`);
    const row=quoteRow(`row cal-row cal-${event.phase}${(event.endIso||event.iso)<today?' is-past':''}`,t.phases[event.phase],event.quote,event.line,date);
    list.append(row);
  }
  card.append(list,element('p','card-foot',t.calendarNote));
}

function renderRulesCard() {
  const t=copy[language];
  const card=$('#rulesCard');
  const rules=current.rules||[], items=current.obligations||[];
  const control=selectControl('rulesView',t.rulesViewLabel,[['rules',`${t.rulesTitle} (${rules.length})`],['obligations',`${t.obligationsTitle} (${items.length})`]],rulesView,(value)=>{rulesView=value;renderRulesCard();});
  cardHeader(card,'rules-title',rulesView==='rules'?t.rulesTitle:t.obligationsTitle,'',control);
  const list=element('ul','row-list');
  if(rulesView==='rules'){
    if(!rules.length){ card.append(element('p','card-empty',t.rulesEmpty)); return; }
    // Several rules from one line ("2 pages; up to 10 MB in PDF") share one row and one quote.
    const byLine=new Map();
    for(const rule of rules){ if(!byLine.has(rule.line)) byLine.set(rule.line,[]); byLine.get(rule.line).push(rule); }
    for(const [line,group] of byLine) list.append(quoteRow('row rule-row',group.map(describeRule).join(' · '),group[0].quote,line));
    card.append(list,element('p','card-foot',t.rulesNote));
  } else {
    if(!items.length){ card.append(element('p','card-empty',t.obligationsEmpty)); return; }
    for(const item of items) list.append(quoteRow(`row obligation-row obligation-${item.kind}`,t.obligationKinds[item.kind],item.quote,item.line));
    card.append(list,element('p','card-foot',t.obligationsNote));
  }
}

const NAV_SECTIONS=[['insightBoard','navSummary'],['noticeCalendar','navCalendar'],['rulesCard','navRules'],['signalsCard','navAlerts'],['gapsCard','navGaps'],['readinessCard','navReady'],['shortlist','navShortlist'],['lens','navLens'],['evidenceList','navPoints'],['planPanel','navPlan']];
let navObserver=null;
// The section a nav link pointed to stays marked until the reader scrolls by themselves.
let navPinned=null;
function renderSectionNav() {
  const t=copy[language];
  const nav=$('#sectionNav'); nav.replaceChildren();
  nav.setAttribute('aria-label',t.navLabel);
  for(const [id,key] of NAV_SECTIONS){
    const target=document.getElementById(id);
    if(!target) continue;
    const link=element('a','nav-link',t[key]); link.href=`#${id}`; link.dataset.target=id;
    link.addEventListener('click',(event)=>{ event.preventDefault(); if(target.tagName==='DETAILS') target.open=true; navPinned=id; update(); target.scrollIntoView({behavior:motion(),block:'start'}); });
    nav.append(link);
  }
  navObserver?.disconnect();
  const update=()=>{
    const line=innerHeight*0.4;
    nav.classList.toggle('is-off',nodes.results.getBoundingClientRect().top>innerHeight*0.6);
    let active=NAV_SECTIONS[0][0];
    if(navPinned) active=navPinned;
    else {
      // Sections that span the reading line, without containers such as the summary board.
      const spanning=NAV_SECTIONS.filter(([id])=>id!=='planPanel').map(([id])=>document.getElementById(id)).filter((node)=>{ const box=node?.getBoundingClientRect(); return box && box.top<=line && box.bottom>line; });
      const inner=spanning.filter((node)=>!spanning.some((other)=>other!==node && node.contains(other)));
      // Of cards side by side, the one the reader entered last (top closest to the line) wins; a tie keeps reading order.
      let best=null;
      for(const node of inner){ const top=node.getBoundingClientRect().top; if(!best || top>best.top+2) best={node,top}; }
      if(best) active=best.node.id;
      else {
        // Between sections: the last one whose top has passed the reading line.
        for(const [id] of NAV_SECTIONS){ if(id==='planPanel') continue; const node=document.getElementById(id); if(node && node.getBoundingClientRect().top<=line) active=id; }
      }
    }
    nav.querySelectorAll('.nav-link').forEach((link)=>{ const on=link.dataset.target===active; link.classList.toggle('is-active',on); if(on) link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current'); });
  };
  let timer=0;
  const onScroll=()=>{ if(!timer) timer=setTimeout(()=>{ timer=0; update(); },60); };
  const release=()=>{ if(navPinned){ navPinned=null; onScroll(); } };
  addEventListener('scroll',onScroll,{passive:true});
  for(const type of ['wheel','touchmove','keydown']) addEventListener(type,release,{passive:true});
  navObserver={disconnect:()=>{ removeEventListener('scroll',onScroll); for(const type of ['wheel','touchmove','keydown']) removeEventListener(type,release); }};
  update();
}

function excerptGroups() {
  const groups=new Map();
  for(const [index,item] of (current.items||[]).entries()){
    const line=Number.isInteger(item.line)?item.line:-(index+1);
    if(!groups.has(line)) groups.set(line,{line,quote:item.quote,items:[],ids:[]});
    const group=groups.get(line); group.items.push(item); group.ids.push(String(item.id??index));
  }
  return [...groups.values()];
}

function setReviewed(ids,on) {
  for(const id of ids){ if(on) reviewed.add(id); else reviewed.delete(id); }
}

function describeRule(rule) {
  const t=copy[language];
  if(rule.kind==='limit') return `${rule.bound==='min'?t.ruleMin:t.ruleMax} ${new Intl.NumberFormat(language==='pt'?'pt-PT':'en-GB').format(rule.value)} ${t.units[rule.unit]}`;
  if(rule.kind==='format') return `${t.ruleFormats}: ${rule.formats.join(', ')}`;
  return `${t.ruleLanguage}: ${rule.languages.map((code)=>t.languages[code]||code).join(', ')}`;
}
function entryText(entry) { return entry.kind==='rule'?describeRule(entry.rule):entry.text; }

function currentSummary() {
  const t=copy[language];
  return summarize({text:nodes.text.value,title:pdfInfo?.name?titleFrom(nodes.text.value,pdfInfo.name):titleFrom(nodes.text.value,t.untitled),analysis:current,ready:current.checklist.filter((entry)=>ready.has(entry.id)).length,today:localIsoDay(),example:current.example});
}

function syncShortlist() {
  if(!current) return;
  const key=textKey(nodes.text.value);
  if(shortlist.some((entry)=>entry.key===key)) { shortlist=upsert(shortlist,currentSummary()); renderShortlist(); }
}

function renderBoard() {
  const t=copy[language];
  const hasPrevious=Boolean(nodes.previous.value.trim());
  const state=countdownState();
  const total=current.checklist.length;
  const done=current.checklist.filter((entry)=>ready.has(entry.id)).length;
  const percent=total?Math.round(done/total*100):0;
  const signalCount=current.signals.filter((signal)=>!signal.unspecified).length;

  renderDashboard({state,total,done,percent,signalCount});
  syncShortlist();

  // Alerts
  const signals=$('#signalsCard');
  cardHeader(signals,'signals-title',t.signalsTitle,String(current.signals.length));
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
  cardHeader(gaps,'gaps-title',t.gapsTitle,String(current.gaps.length));
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

  // Readiness
  const readiness=$('#readinessCard');
  cardHeader(readiness,'ready-title',t.readyTitle,total?`${done}/${total}`:'');
  if(!total) readiness.append(element('p','card-empty',t.noReady));
  else {
    const meter=element('div','ready-meter'); meter.setAttribute('role','progressbar'); meter.setAttribute('aria-valuemin','0'); meter.setAttribute('aria-valuemax','100'); meter.setAttribute('aria-valuenow',String(percent)); meter.setAttribute('aria-label',t.readyTitle);
    const fill=element('span'); fill.style.width=`${percent}%`; meter.append(fill);
    readiness.append(meter);
    for(const [kind,label] of [['document',t.readyDocuments],['rule',t.readyRules],['condition',t.readyConditions]]){
      const entries=current.checklist.filter((entry)=>entry.kind===kind);
      if(!entries.length) continue;
      readiness.append(element('p','ready-group',label));
      const group=element('ul','ready-list');
      for(const entry of entries){
        const row=element('li','ready-item');
        const box=element('input'); box.type='checkbox'; box.id=`ready-${entry.id}`; box.checked=ready.has(entry.id);
        box.addEventListener('change',()=>{if(box.checked) ready.add(entry.id); else ready.delete(entry.id); renderBoard(); document.getElementById(`ready-${entry.id}`)?.focus();});
        const label=element('label','',entryText(entry)); label.htmlFor=box.id;
        row.append(box,label); group.append(row);
      }
      readiness.append(group);
    }
    readiness.append(element('p','card-foot',t.notEligibility));
  }
}

function renderChanges() {
  const t=copy[language];
  nodes.changes.replaceChildren();
  const changes=Array.isArray(current.changes)?current.changes:[];
  if(!changes.length) {
    nodes.changes.append(element('p','subtle',t.noChanges));
    return;
  }

  // Label changes with categories and signals
  let labelled=[];
  try {
    labelled=labelChanges(changes);
  } catch(e) {
    // Fallback if labelling fails
    labelled=changes.map((change)=>({...change, categories:[], signalKinds:[]}));
  }

  // Add filter control
  const filterWrap=element('div','changes-filter');
  const filter=selectControl('changesFilter',t.changesFilterLabel,[['all',t.changesFilterAll],['labelled',t.changesFilterLabelled]],changesFilter,(value)=>{changesFilter=value;renderChanges();});
  filterWrap.append(filter);
  const caveat=element('p','subtle',t.changesCaveat);
  filterWrap.append(caveat);
  nodes.changes.append(filterWrap);

  // Render changes with filter
  const list=element('div','changes-list');
  labelled.forEach((change)=>{
    const hasLabel=change.categories.length>0 || change.signalKinds.length>0;
    if(changesFilter==='labelled' && !hasLabel) return;

    const row=element('div','change-item');
    const label=element('b','',change.kind==='added'?t.added:t.removed);
    const quote=element('span','');
    quote.textContent=change.quote;
    row.append(label,quote);

    // Add badges for categories and signals
    if(hasLabel) {
      const tags=element('div','change-tags');
      for(const cat of change.categories) {
        const badge=element('span','change-badge change-category',t.categories[cat]||cat);
        tags.append(badge);
      }
      for(const sig of change.signalKinds) {
        const badge=element('span','change-badge change-signal',t.signalNames[sig]||sig);
        tags.append(badge);
      }
      row.append(tags);
    }

    list.append(row);
  });
  if(!list.childElementCount) list.append(element('p','subtle',t.changesNoTopics));
  nodes.changes.append(list);
}

function renderResults() {
  if(!current) return;
  const t=copy[language];
  nodes.list.replaceChildren();
  const items=Array.isArray(current.items)?current.items:[];
  $('#partialEvidence').hidden=!current.itemsTruncated;
  $('#partialEvidence').textContent=t.partialEvidence;
  nodes.empty.hidden=items.length>0;
  $('#planStatus').textContent=current.example?t.demoWarning:t.planInitial;
  // One excerpt per line: a line that is both "costs" and "funding" is shown once with both labels.
  const groups=excerptGroups();
  $('#evidenceCount').textContent=String(groups.length);
  $('#reviewedCount').textContent=String(groups.filter((group)=>group.ids.every((id)=>reviewed.has(id))).length);
  groups.forEach((group,index)=>{
    const key=group.ids[0];
    const isReviewed=group.ids.every((id)=>reviewed.has(id));
    const row=element('article','evidence-item');
    row.dataset.line=String(group.line);
    const category=element('div','evidence-category',group.items.map((item)=>t.categories[item.category]||item.category).join(' · '));
    const badge=pageBadge(group.line); if(badge) category.append(badge);
    const content=element('div','evidence-content');
    content.append(element('blockquote','',group.quote));
    if(Number.isInteger(group.line)) content.append(lineLink(group.line));
    const dated=group.items.find((item)=>item.date?.raw);
    if(dated){
      const status=t[dated.date.status] || t.candidate;
      const range=dated.date.range && dated.date.iso ? ` · ${t.rangeClosing.replace('{date}',formatDay(dated.date.iso,{day:'numeric',month:'long',year:'numeric'}))}` : '';
      content.append(element('p','evidence-meta',`${dated.date.raw} · ${status}${range}`));
    }
    const checks=[...new Set(group.items.map((item)=>t.checks[item.category]).filter(Boolean))];
    if(checks.length) content.append(element('p','evidence-next',`${t.nextStep}: ${checks.join(' ')}`));
    const actions=element('div','evidence-actions');
    const btn=element('button','review-button',isReviewed?t.undoReview:t.markReviewed);
    btn.type='button'; btn.classList.toggle('is-reviewed',isReviewed);
    btn.setAttribute('aria-pressed',String(isReviewed));
    btn.addEventListener('click',()=>{
      setReviewed(group.ids,!isReviewed);
      renderResults();
      nodes.list.querySelectorAll('.review-button')[index]?.focus();
      nodes.announcement.textContent=!isReviewed?t.reviewed:t.notReviewed;
    });
    actions.append(btn,element('span','candidate-flag',isReviewed?t.reviewed:t.candidate));
    const deadlineItem=group.items.find((item)=>item.category==='deadline' && item.date?.status==='explicit' && item.date.iso);
    if(deadlineItem && isReviewed) {
      const calendar=element('button','calendar-button',t.calendarAction);
      calendar.type='button';
      calendar.addEventListener('click',()=>{
        try {
          const uid=globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const ics=createCalendarReference({iso:deadlineItem.date.iso,quote:deadlineItem.quote,sourceUrl:current.sourceUrl,language,uid,now:new Date(),example:current.example});
          downloadFile(ics,'text/calendar;charset=utf-8',current.example?'fictional-example-deadline.ics':'deadline-reference.ics');
        } catch { nodes.announcement.textContent=t.calendarError; }
      });
      actions.append(calendar);
      content.append(element('p','calendar-hint',t.calendarHint));
    }
    content.append(actions);
    if(isReviewed) {
      const label=element('label','note-field',t.noteLabel);
      label.htmlFor=`note-${key}`;
      const note=element('textarea','note-input');
      note.id=`note-${key}`; note.maxLength=1000; note.rows=2; note.placeholder=t.notePlaceholder; note.value=notes.get(key)||'';
      note.addEventListener('input',()=>{if(note.value) notes.set(key,note.value); else notes.delete(key)});
      content.append(label,note);
    }
    row.append(category,content); nodes.list.append(row);
  });
  const hasPrevious=Boolean(nodes.previous.value.trim());
  nodes.changesSection.hidden=!hasPrevious;
  nodes.changes.replaceChildren();
  if(hasPrevious) {
    $('#partialChanges').hidden=!current.changesTruncated;
    $('#partialChanges').textContent=t.partialChanges;
    renderChanges();
  }
  if(current.sourceUrl) {nodes.link.href=current.sourceUrl;nodes.link.hidden=false;} else {nodes.link.hidden=true;nodes.link.removeAttribute('href');}
  renderBoard();
  renderLens();
  renderKit();
  renderShortlist();
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
  for(const entry of current.checklist) lines.push(`[${ready.has(entry.id)?'x':' '}] ${entryText(entry)}`);
  lines.push(t.readyNote,'');
  lines.push('',t.calendarTitle,'');
  if(!current.calendar.length) lines.push(t.briefNone);
  for(const event of current.calendar) lines.push(`- ${event.iso}${event.endIso?` → ${event.endIso}`:''} · ${t.phases[event.phase]}: ${event.quote}`);
  lines.push('',t.rulesTitle,'');
  if(!current.rules.length) lines.push(t.briefNone);
  for(const rule of current.rules) lines.push(`- ${describeRule(rule)} — ${rule.quote}`);
  lines.push('',t.obligationsTitle,'');
  if(!current.obligations.length) lines.push(t.briefNone);
  for(const item of current.obligations) lines.push(`- [${t.obligationKinds[item.kind]}] ${item.quote}`);
  lines.push('');
  const items=Array.isArray(current.items)?current.items:[];
  if(current.itemsTruncated) lines.push(t.partialEvidence,'');
  if(!items.length) lines.push(t.noCandidates);
  for(const group of excerptGroups()){
    const isReviewed=group.ids.every((id)=>reviewed.has(id));
    lines.push(`${group.items.map((item)=>t.categories[item.category]||item.category).join(' · ')} — ${isReviewed?t.checked:t.unchecked}${pageRef(group.line)}`,'',String(group.quote),'');
    const checks=[...new Set(group.items.map((item)=>t.checks[item.category]).filter(Boolean))];
    if(checks.length) lines.push(`${t.nextStep}: ${checks.join(' ')}`,'');
    const dated=group.items.find((item)=>item.date?.raw);
    if(dated) lines.push(`${dated.date.raw} — ${t[dated.date.status]||t.candidate}`,'');
    if(isReviewed && notes.has(group.ids[0])) lines.push(`${t.notePrefix}: ${notes.get(group.ids[0])}`,'');
  }
  if(nodes.previous.value.trim()) {
    lines.push(t.changesBrief,'',t.changesNote,'');
    if(current.changesTruncated) lines.push(t.partialChanges,'');
    for(const change of current.changes||[]) lines.push(`- ${change.kind==='added'?t.added:t.removed}: ${change.quote}`);
  }
  lines.push('',t.reviewFooter,'');
  return lines.join('\n');
}

function isSamplePrevious(value) {
  return value===copy.en.previous || value===copy.pt.previous;
}

function loadSample(){
  nodes.text.value=copy[language].example;
  nodes.previous.value=copy[language].previous;
  nodes.url.value='';
  nodes.previous.closest('details').open=true;
  nodes.count.textContent=String(nodes.text.value.length);
  sampleLoaded=true;
  pdfInfo=null; pdfMessage=null; renderPdfStatus();
  runAnalysis();
}

function downloadFile(content,type,filename){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

nodes.form.addEventListener('submit',runAnalysis);
for(const node of [nodes.text,nodes.url,nodes.previous]) node.addEventListener('input',()=>{sampleLoaded=/^\s*(FICTIONAL EXAMPLE|EXEMPLO FICTÍCIO)/i.test(nodes.text.value); if(node===nodes.text && !sampleLoaded && isSamplePrevious(nodes.previous.value)) nodes.previous.value=''; if(node===nodes.text && pdfMessage){pdfMessage=null;renderPdfStatus();}nodes.count.textContent=String(nodes.text.value.length);nodes.error.textContent='';clearResults(); if(pdfInfo && nodes.text.value.split('\n').length!==pdfInfo.lineCount){pdfInfo=null;renderPdfStatus();}});
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
document.querySelectorAll('[data-preview-target]').forEach((button)=>button.addEventListener('click',()=>{
  loadSample();
  const target=document.getElementById(button.dataset.previewTarget);
  if(!target || !current) return;
  if(target.tagName==='DETAILS') target.open=true;
  target.scrollIntoView({behavior:motion(),block:'start'});
  nodes.announcement.textContent=copy[language].demoWarning;
}));
$('#saveWorkspace').addEventListener('click',()=>{
  nodes.error.textContent='';
  if(!nodes.text.value.trim()) {nodes.error.textContent=copy[language].enterText;nodes.text.focus();return;}
  try {
    const encoded=encodeWorkspace({text:nodes.text.value,previousText:nodes.previous.value,url:nodes.url.value.trim(),reviewed:[...reviewed],notes:Object.fromEntries([...notes].filter(([id])=>reviewed.has(id))),ready:[...ready],pages:validPageMap()});
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
    stateKey=textKey(data.text);
    nodes.results.hidden=false;renderResults();
    nodes.announcement.textContent=copy[language].planInitial;
  } catch {nodes.error.textContent=copy[language].workspaceError;}
  finally {event.target.value='';}
});
$('#exportButton').addEventListener('click',()=>{
  if(!current) return;
  downloadFile(briefText(),'text/plain;charset=utf-8','dua-opportunity-brief.txt');
});
$('#printButton').addEventListener('click',()=>{if(current) window.print()});
$('#lensQuery').addEventListener('input',()=>applySearch(0));
$('#lensQuery').addEventListener('keydown',(event)=>{ if(event.key==='Enter'){ event.preventDefault(); applySearch(event.shiftKey?-1:1); } if(event.key==='Escape'){ event.target.value=''; applySearch(0); } });
$('#lensPrev').addEventListener('click',()=>applySearch(-1));
$('#lensNext').addEventListener('click',()=>applySearch(1));
setLanguage('en');
