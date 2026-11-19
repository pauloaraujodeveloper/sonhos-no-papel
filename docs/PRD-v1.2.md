# PRD --- PRODUCT REQUIREMENTS DOCUMENT

# SONHOS NO PAPEL

### Plataforma de E-commerce e Gestão Administrativa de Papelaria

**Versão:** 1.2\
**Status:** Requisitos atualizados\
**Tipo:** Aplicação Web Full Stack\
**Frontend e Backend:** Next.js + TypeScript\
**Banco de dados:** PostgreSQL --- Neon\
**Hospedagem:** Vercel\
**Idioma:** Português Brasileiro\
**Moeda:** Real Brasileiro (BRL)

------------------------------------------------------------------------

# 1. VISÃO GERAL DO PRODUTO

A Sonhos no Papel será uma plataforma de comércio eletrônico para uma
papelaria, permitindo que clientes visualizem produtos, consultem
disponibilidade, adicionem itens ao carrinho e encaminhem seus pedidos
diretamente pelo WhatsApp.

A plataforma contará com um painel administrativo independente,
permitindo que a proprietária gerencie produtos, estoque, preços,
imagens, pedidos e identidade visual sem precisar modificar o
código-fonte.

## 1.1. Modelo comercial definido

O modelo inicial de funcionamento será:

1.  O cliente acessa a loja virtual.
2.  Seleciona os produtos.
3.  Adiciona os itens ao carrinho.
4.  Informa seus dados.
5.  Seleciona entrega ou retirada.
6.  Finaliza o pedido pelo WhatsApp.
7.  A proprietária recebe o pedido.
8.  A proprietária encaminha a chave Pix ou QR Code pelo WhatsApp.
9.  O cliente realiza o pagamento.
10. A proprietária confirma o recebimento.
11. O pedido segue para preparação e entrega ou retirada.

**Importante:** o site não receberá pagamentos diretamente nesta
primeira versão.

A funcionalidade de pagamento via Pix diretamente no site ficará em
standby, com arquitetura e estrutura técnica preparadas para
implementação futura.

# 2. OBJETIVOS DO PRODUTO

1.  Criar uma loja virtual profissional.
2.  Apresentar os produtos da papelaria.
3.  Facilitar a seleção e organização de produtos.
4.  Encaminhar pedidos pelo WhatsApp.
5.  Permitir pagamento via Pix por atendimento no WhatsApp.
6.  Gerenciar produtos e estoque.
7.  Oferecer autonomia administrativa.
8.  Permitir personalização visual.
9.  Preparar a arquitetura para pagamentos online futuros.

# 3. PERFIS DE USUÁRIOS

## 3.1. Cliente visitante

Não será necessário criar conta.

O cliente poderá:

-   Navegar pela loja.
-   Pesquisar produtos.
-   Consultar categorias.
-   Visualizar preços.
-   Consultar disponibilidade.
-   Adicionar produtos ao carrinho.
-   Alterar quantidades.
-   Remover produtos.
-   Informar dados para o pedido.
-   Escolher entrega ou retirada.
-   Encaminhar o pedido pelo WhatsApp.

O cliente não realizará pagamentos diretamente no site.

## 3.2. Administrador

A proprietária poderá:

-   Gerenciar produtos.
-   Gerenciar categorias.
-   Controlar estoque.
-   Gerenciar pedidos.
-   Atualizar status.
-   Conferir pagamentos.
-   Gerenciar imagens.
-   Personalizar a identidade visual.
-   Alterar logo e banners.
-   Configurar preços.
-   Configurar informações da loja.
-   Configurar WhatsApp.
-   Gerenciar entrega e retirada.

O acesso deverá ser protegido por autenticação.

# 4. ESTRUTURA DO SISTEMA

## 4.1. Loja pública

Rotas:

-   `/` --- Página inicial.
-   `/produtos` --- Catálogo.
-   `/categoria/[slug]` --- Categorias.
-   `/produto/[slug]` --- Produto individual.
-   `/carrinho` --- Carrinho.
-   `/checkout` --- Dados e revisão do pedido.
-   `/sobre` --- Sobre a papelaria.
-   `/contato` --- Contato.

## 4.2. Painel administrativo

Rotas:

-   `/admin/login`
-   `/admin`
-   `/admin/produtos`
-   `/admin/categorias`
-   `/admin/estoque`
-   `/admin/pedidos`
-   `/admin/pagamentos`
-   `/admin/banners`
-   `/admin/aparencia`
-   `/admin/configuracoes`

# 5. IDENTIDADE VISUAL E DESIGN

Utilizar a logo oficial da Sonhos no Papel como referência.

Paleta inicial:

-   Azul-bebê.
-   Azul-marinho.
-   Rosa-claro.
-   Lilás-claro.
-   Amarelo suave.
-   Branco.

A interface deverá apresentar:

-   Design autoral.
-   Navegação intuitiva.
-   Layout moderno.
-   Tipografia consistente.
-   Cards elegantes.
-   Transições suaves.
-   Animações discretas.
-   Microinterações.
-   Responsividade.
-   Acessibilidade.

O administrador deverá conseguir personalizar as cores, logo, banners e
conteúdos da loja.

# 6. REQUISITOS FUNCIONAIS

## RF-001 --- Página inicial

Apresentar:

-   Logo.
-   Menu.
-   Pesquisa.
-   Carrinho.
-   Banner principal.
-   Categorias.
-   Produtos em destaque.
-   Novidades.
-   Promoções.
-   Seção institucional.
-   Botão de WhatsApp.
-   Rodapé.

Os conteúdos deverão ser administráveis.

## RF-002 --- Categorias

Categorias iniciais:

-   Canetas.
-   Lápis.
-   Agendas.
-   Cadernos.
-   Pincéis.

Permitir criar, editar, excluir, ativar e desativar categorias.

## RF-003 --- Produtos

Cada produto deverá possuir:

-   Nome.
-   Slug.
-   Descrição.
-   Categoria.
-   Imagens.
-   Preço.
-   Preço promocional.
-   Estoque.
-   SKU opcional.
-   Status.
-   Destaque.
-   Data de cadastro.

Permitir pesquisa, filtros, ordenação e paginação.

## RF-004 --- Detalhes do produto

Exibir:

-   Galeria de imagens.
-   Nome.
-   Descrição.
-   Preço.
-   Promoção.
-   Disponibilidade.
-   Quantidade.
-   Botão adicionar ao carrinho.
-   Botão comprar agora.
-   Produtos relacionados.

## RF-005 --- Carrinho

Permitir:

-   Adicionar produtos.
-   Remover produtos.
-   Alterar quantidades.
-   Visualizar preços.
-   Visualizar subtotal.
-   Visualizar descontos.
-   Visualizar total.
-   Continuar comprando.
-   Avançar para checkout.

O carrinho deverá persistir durante a navegação e atualização da página.

Os preços e estoques deverão ser validados novamente no servidor antes
do registro do pedido.

## RF-006 --- Checkout sem cadastro

O cliente não precisará criar conta.

Dados obrigatórios:

-   Nome completo.
-   Telefone.
-   WhatsApp.

Dados condicionais para entrega:

-   CEP.
-   Rua.
-   Número.
-   Bairro.
-   Cidade.
-   Complemento.
-   Ponto de referência.

O checkout deverá apresentar um resumo contendo:

-   Produtos.
-   Quantidades.
-   Valores individuais.
-   Subtotal.
-   Descontos.
-   Taxa de entrega, quando aplicável.
-   Valor total.
-   Modalidade de recebimento.

Não apresentar opção de pagamento online nesta versão.

## RF-007 --- Finalização pelo WhatsApp

Esta será a principal e única forma de encaminhamento dos pedidos no
MVP.

### Funcionamento

1.  Cliente acessa a loja.
2.  Seleciona os produtos.
3.  Adiciona os itens ao carrinho.
4.  Informa seus dados.
5.  Seleciona entrega ou retirada.
6.  Visualiza o resumo da compra.
7.  Clica em **Finalizar pedido pelo WhatsApp**.
8.  O sistema registra a solicitação no banco de dados.
9.  O sistema gera uma mensagem organizada.
10. O cliente é direcionado ao WhatsApp da papelaria.

### Mensagem automática

A mensagem deverá apresentar:

-   Identificação da Sonhos no Papel.
-   Número do pedido.
-   Nome do cliente.
-   Telefone.
-   Produtos selecionados.
-   Quantidades.
-   Valores individuais.
-   Subtotal.
-   Descontos.
-   Taxa de entrega.
-   Valor total.
-   Modalidade de recebimento.
-   Endereço, quando aplicável.
-   Observações.

### Exemplo de mensagem

> Olá! Gostaria de realizar um pedido na Sonhos no Papel.
>
> **Pedido:** #SP-0001
>
> **Produtos:** - 2x Caneta --- R\$ 10,00 - 1x Caderno --- R\$ 35,00 -
> 1x Pincel --- R\$ 15,00
>
> **Subtotal:** R\$ 70,00\
> **Entrega:** R\$ 5,00\
> **Total:** R\$ 75,00
>
> **Recebimento:** Entrega\
> **Cliente:** Nome do cliente
>
> Aguardo as informações para pagamento via Pix. Obrigado!

O conteúdo deverá ser gerado dinamicamente conforme o pedido.

### Regras

-   O número do WhatsApp será configurável no painel.
-   O pedido deverá ser registrado antes do redirecionamento.
-   O cliente deverá receber um identificador de pedido.
-   O redirecionamento utilizará o formato oficial `wa.me`.
-   O sistema não deverá considerar o pedido pago após o
    redirecionamento.
-   A abertura do WhatsApp deverá ser tratada como encaminhamento do
    pedido, não como confirmação de que a mensagem foi efetivamente
    enviada.

## RF-008 --- Pagamento via Pix pelo WhatsApp

O pagamento será realizado fora da plataforma.

### Fluxo

1.  Cliente encaminha o pedido.
2.  A proprietária recebe as informações.
3.  A proprietária confirma os produtos e a disponibilidade.
4.  A proprietária encaminha a chave Pix ou QR Code pelo WhatsApp.
5.  O cliente realiza o pagamento.
6.  A proprietária confere o recebimento.
7.  O pagamento é atualizado no painel administrativo.
8.  O pedido segue para preparação.

### Configuração administrativa

Permitir cadastrar e consultar:

-   Chave Pix.
-   Tipo da chave.
-   Nome do titular.
-   Banco ou instituição financeira.
-   Cidade.
-   Informações adicionais para pagamento.

Essas informações serão utilizadas pela proprietária para atender os
pedidos pelo WhatsApp.

O site não deverá gerar cobranças Pix dinâmicas nem apresentar um
checkout financeiro nesta versão.

## RF-009 --- Pagamento online em standby

A arquitetura deverá estar preparada para uma futura modalidade de
pagamento diretamente pelo site.

Entretanto, essa funcionalidade deverá permanecer desabilitada no MVP.

### Preparação técnica

Criar uma arquitetura desacoplada para:

-   Provedor de pagamento.
-   Geração de cobrança Pix.
-   QR Code dinâmico.
-   Pix Copia e Cola.
-   TXID.
-   Webhooks.
-   Confirmação automática.
-   Consulta de transações.
-   Cancelamento e estorno.

Criar um controle de funcionalidade, por exemplo:

`ONLINE_PIX_ENABLED=false`

Enquanto desabilitado:

-   Não exibir opção de Pix online.
-   Não exibir QR Code de pagamento no checkout.
-   Não disponibilizar botão de pagamento.
-   Não iniciar cobranças.
-   Não receber pedidos com pagamento online.
-   Não executar rotinas de cobrança.

Quando a funcionalidade for implementada e homologada, o administrador
poderá habilitá-la por configuração apropriada.

**Importante:** preparar a arquitetura não significa implementar uma
integração bancária fictícia. A integração real deverá ser desenvolvida
e testada quando essa funcionalidade for ativada.

## RF-010 --- Entrega e retirada

Oferecer duas modalidades.

### Retirada na loja

O cliente deverá visualizar:

-   Endereço.
-   Horário de funcionamento.
-   Orientações de retirada.

Não deverá ser cobrada taxa de entrega.

### Entrega

Solicitar:

-   CEP.
-   Rua.
-   Número.
-   Bairro.
-   Cidade.
-   Complemento opcional.
-   Referência opcional.

Permitir configurar:

-   Taxa fixa.
-   Taxas por bairro.
-   Taxas por região.
-   Entrega gratuita a partir de determinado valor.
-   Regiões atendidas.

O valor deverá ser calculado no servidor.

## RF-011 --- Dashboard administrativo

Apresentar:

-   Total de pedidos.
-   Pedidos novos.
-   Pedidos aguardando confirmação.
-   Pedidos confirmados.
-   Pedidos em preparação.
-   Pedidos concluídos.
-   Produtos cadastrados.
-   Produtos com estoque baixo.
-   Produtos esgotados.
-   Valores de vendas confirmadas.

Os indicadores deverão considerar pedidos efetivamente confirmados, sem
tratar solicitações de WhatsApp como vendas pagas.

## RF-012 --- Gerenciamento de pedidos

Permitir:

-   Consultar pedidos.
-   Pesquisar.
-   Filtrar.
-   Visualizar detalhes.
-   Consultar cliente.
-   Consultar produtos.
-   Alterar status.
-   Registrar pagamento.
-   Registrar observações.
-   Consultar histórico.

## RF-013 --- Controle de estoque

Implementar:

-   Entrada.
-   Saída.
-   Ajuste.
-   Histórico.
-   Estoque mínimo.
-   Alertas.
-   Produtos esgotados.

A reserva de estoque deverá respeitar o fluxo de confirmação comercial.

Pedidos ainda não confirmados pelo WhatsApp não deverão gerar baixa
definitiva de estoque.

Implementar reserva temporária quando necessário, com expiração
configurável e liberação de estoque em caso de cancelamento.

## RF-014 --- Personalização da loja

Permitir:

-   Alterar logo.
-   Alterar favicon.
-   Alterar paleta.
-   Gerenciar banners.
-   Alterar textos.
-   Definir produtos destacados.
-   Personalizar rodapé.
-   Pré-visualizar alterações.
-   Publicar alterações.

As alterações deverão ser refletidas sem necessidade de novo deploy.

## RF-015 --- Configurações gerais

Permitir gerenciar:

-   Nome da loja.
-   Logo.
-   WhatsApp.
-   E-mail.
-   Endereço.
-   Horário.
-   Redes sociais.
-   Chave Pix.
-   Informações de entrega.
-   Informações de retirada.

# 7. REGRAS DE NEGÓCIO

## RN-001 --- Compra sem cadastro

O cliente poderá realizar pedidos sem criar conta.

## RN-002 --- Canal de venda

No MVP, todos os pedidos deverão ser encaminhados pelo WhatsApp.

## RN-003 --- Pagamento

O pagamento será tratado diretamente entre cliente e proprietária pelo
WhatsApp.

## RN-004 --- Pix

A proprietária enviará a chave Pix ou QR Code ao cliente.

O sistema administrativo permitirá registrar a confirmação após
conferência do recebimento.

## RN-005 --- Pagamento online

O pagamento via Pix diretamente pelo site permanecerá desabilitado até
implementação e ativação formal.

## RN-006 --- Estoque

Não permitir estoque negativo.

Não realizar baixa definitiva apenas porque o cliente encaminhou uma
solicitação pelo WhatsApp.

## RN-007 --- Preços

O servidor será responsável pelo cálculo dos valores.

## RN-008 --- Histórico

Os pedidos deverão preservar os preços e informações dos produtos no
momento da solicitação.

## RN-009 --- Entrega

O cliente deverá escolher entre entrega e retirada.

## RN-010 --- Frete

O valor da entrega deverá ser calculado e registrado antes do
encaminhamento ao WhatsApp.

## RN-011 --- Confirmação

O pedido somente deverá ser considerado comercialmente confirmado após
validação da proprietária.

## RN-012 --- Personalização

As alterações visuais serão armazenadas no banco de dados.

## RN-013 --- Cancelamento

Pedidos cancelados deverão liberar eventuais reservas de estoque.

## RN-014 --- Auditoria

Alterações de estoque, pedidos e pagamentos deverão possuir histórico.

# 8. STATUS DOS PEDIDOS E PAGAMENTOS

Os status comerciais e financeiros deverão ser independentes.

### Status do pedido

-   Novo pedido.
-   Aguardando confirmação.
-   Confirmado.
-   Em preparação.
-   Pronto para retirada.
-   Saiu para entrega.
-   Concluído.
-   Cancelado.

### Status do pagamento

-   Não informado.
-   Aguardando pagamento.
-   Em análise.
-   Pago.
-   Cancelado.
-   Estornado, quando aplicável.

### Status do recebimento

-   Retirada.
-   Entrega pendente.
-   Em entrega.
-   Entregue.
-   Retirado.

A proprietária deverá atualizar essas informações pelo painel.

# 9. MODELAGEM DO BANCO DE DADOS

Entidades previstas:

  Entidade                Responsabilidade
  ----------------------- -----------------------
  AdminUsers              Administradores
  Categories              Categorias
  Products                Produtos
  ProductImages           Imagens
  ProductVariants         Variações
  Customers               Dados dos clientes
  Orders                  Pedidos
  OrderItems              Itens dos pedidos
  Payments                Registros financeiros
  InventoryMovements      Estoque
  InventoryReservations   Reservas
  StoreSettings           Configurações
  Banners                 Banners
  SiteSections            Seções
  DeliverySettings        Entrega
  DeliveryZones           Regiões
  OrderStatusHistory      Histórico
  PaymentStatusHistory    Histórico financeiro

A estrutura deverá preservar os dados históricos dos pedidos.

Não será exigido cadastro de autenticação para clientes.

# 10. ARQUITETURA TÉCNICA

## Stack

  Camada                Tecnologia
  --------------------- ---------------------------
  Framework             Next.js
  Linguagem             TypeScript
  Interface             React
  Estilização           Tailwind CSS
  Componentes           shadcn/ui
  Banco                 PostgreSQL
  Hospedagem do banco   Neon
  ORM                   Prisma ou Drizzle
  Validação             Zod
  Hospedagem            Vercel
  Imagens               Cloudinary ou Vercel Blob

## Módulos

-   Catalog.
-   Products.
-   Categories.
-   Cart.
-   Checkout.
-   Orders.
-   Customers.
-   WhatsApp.
-   Payments.
-   PaymentProviders.
-   Inventory.
-   Delivery.
-   StoreSettings.
-   Admin.

## Arquitetura de pagamentos futuros

Criar uma interface desacoplada de provedor de pagamentos.

A implementação futura deverá suportar:

-   Geração de cobranças.
-   QR Code Pix dinâmico.
-   Pix Copia e Cola.
-   TXID.
-   Consulta de pagamentos.
-   Webhooks.
-   Confirmação automática.
-   Idempotência.
-   Estornos.

A implementação inicial deverá manter esse módulo inativo e sem
dependência operacional do checkout atual.

## Feature flag

Utilizar configuração centralizada para controlar a disponibilidade do
pagamento online.

Valor inicial:

`ONLINE_PIX_ENABLED=false`

A interface, as rotas e os serviços deverão respeitar essa configuração.

Não confiar apenas na ocultação de botões: o backend também deverá
impedir a criação de cobranças enquanto a funcionalidade estiver
desabilitada.

# 11. SEGURANÇA E PRIVACIDADE

Implementar:

-   Autenticação administrativa.
-   Proteção de rotas.
-   Hash seguro de senhas.
-   Validação no servidor.
-   Rate limiting.
-   Proteção contra SQL Injection.
-   Proteção contra XSS.
-   Proteção de variáveis de ambiente.
-   Logs sem dados sensíveis.
-   Auditoria de alterações.
-   Boas práticas LGPD.

# 12. REQUISITOS NÃO FUNCIONAIS

-   Responsividade.
-   Performance.
-   SEO.
-   Acessibilidade.
-   Segurança.
-   Manutenibilidade.
-   Disponibilidade.
-   Tratamento de erros.
-   Testes automatizados.

# 13. CRITÉRIOS DE ACEITAÇÃO

## Loja

-   [ ] Home funcional.
-   [ ] Categorias.
-   [ ] Catálogo.
-   [ ] Pesquisa.
-   [ ] Filtros.
-   [ ] Página individual.
-   [ ] Carrinho.
-   [ ] Alteração de quantidades.
-   [ ] Checkout sem cadastro.
-   [ ] Cálculo correto de valores.
-   [ ] Entrega.
-   [ ] Retirada.
-   [ ] Encaminhamento pelo WhatsApp.
-   [ ] Mensagem automática com os detalhes.
-   [ ] Identificador de pedido.

## Pagamentos

-   [ ] Envio de chave Pix pelo WhatsApp.
-   [ ] Envio de QR Code pela proprietária.
-   [ ] Registro manual do pagamento.
-   [ ] Histórico financeiro.
-   [ ] Pix online desabilitado.
-   [ ] Arquitetura preparada para futura integração.

## Administração

-   [ ] Login.
-   [ ] Dashboard.
-   [ ] Produtos.
-   [ ] Categorias.
-   [ ] Estoque.
-   [ ] Pedidos.
-   [ ] Pagamentos.
-   [ ] Configurações.
-   [ ] Personalização.
-   [ ] Banners.
-   [ ] WhatsApp.
-   [ ] Entrega.
-   [ ] Retirada.

## Infraestrutura

-   [ ] Neon conectado.
-   [ ] Migrações.
-   [ ] Upload externo.
-   [ ] Vercel configurada.
-   [ ] Variáveis de ambiente.
-   [ ] Testes.
-   [ ] Documentação.
-   [ ] Auditoria.

# 14. ROADMAP

## Fase 1 --- Fundação

-   Análise das Skills.
-   Diagnóstico.
-   Arquitetura.
-   SPEC.
-   Design System.
-   Neon.
-   Banco de dados.

## Fase 2 --- Loja virtual

-   Home.
-   Categorias.
-   Produtos.
-   Pesquisa.
-   Carrinho.
-   Checkout.

## Fase 3 --- Administração

-   Login.
-   Dashboard.
-   Produtos.
-   Estoque.
-   Pedidos.
-   Personalização.
-   Configurações.

## Fase 4 --- Operação comercial

-   Integração WhatsApp.
-   Registro de pedidos.
-   Mensagens automáticas.
-   Configuração Pix.
-   Confirmação manual.
-   Entrega.
-   Retirada.

## Fase 5 --- Preparação para pagamentos futuros

-   Abstração de provedores.
-   Modelo de pagamentos.
-   Feature flag.
-   Contratos de integração.
-   Testes de isolamento do módulo.

Não ativar pagamentos online nesta fase.

## Fase 6 --- Qualidade e produção

-   Testes.
-   Segurança.
-   Performance.
-   SEO.
-   Auditoria.
-   Deploy na Vercel.
-   Documentação.

# 15. EVOLUÇÃO FUTURA

-   Pix diretamente no site.
-   QR Code dinâmico.
-   Pix Copia e Cola.
-   Confirmação automática.
-   Integração com provedores.
-   Cadastro opcional de clientes.
-   Histórico de compras.
-   Cupons.
-   Lista de desejos.
-   Avaliações.
-   Programa de fidelidade.
-   Relatórios avançados.
-   Fornecedores.
-   Integração com transportadoras.

# 16. DIRETRIZES PARA O AGENTE CLAUDE

Antes de iniciar o desenvolvimento:

1.  Ler integralmente este PRD.
2.  Identificar todas as Skills criadas e vinculadas ao agente.
3.  Consultar as Skills relevantes.
4.  Inspecionar o projeto existente.
5.  Elaborar a SPEC técnica.
6.  Definir arquitetura.
7.  Planejar banco de dados.
8.  Projetar a interface.
9.  Implementar por módulos.
10. Testar os fluxos.
11. Realizar auditoria.
12. Preparar o deploy.

O agente deverá utilizar suas Skills de Web Design, Design Gráfico,
Branding, Marketing, UI/UX, Desenvolvimento Web, Arquitetura e
Engenharia de Software conforme a necessidade de cada etapa.

Não criar funcionalidades fictícias.

Não deixar botões sem funcionamento.

Não considerar o pagamento online como parte do MVP.

Não ativar a feature flag de Pix online.

Não comprometer a arquitetura futura em função da simplicidade da
primeira versão.

# 17. DEFINITION OF DONE

Uma funcionalidade será considerada pronta quando:

-   Interface implementada.
-   Backend funcional.
-   Persistência correta.
-   Validação.
-   Segurança.
-   Tratamento de erros.
-   Feedback visual.
-   Responsividade.
-   Testes executados.

O MVP estará concluído quando todos os requisitos obrigatórios estiverem
implementados e testados.

# 18. RESULTADO FINAL

Entregar uma plataforma profissional para a Sonhos no Papel.

O cliente deverá conseguir navegar, selecionar produtos, montar o
carrinho, informar seus dados e encaminhar o pedido diretamente pelo
WhatsApp.

A proprietária deverá receber um pedido organizado, encaminhar a chave
Pix ou QR Code pelo WhatsApp, confirmar o pagamento e gerenciar a
preparação e entrega pelo painel administrativo.

O pagamento diretamente pelo site deverá permanecer em standby, com
estrutura técnica preparada para ativação futura.

A proprietária deverá administrar a loja de maneira independente, sem
precisar modificar código-fonte.

**Este documento representa a especificação oficial do produto, versão
1.2. Toda implementação deverá respeitar este escopo.**
