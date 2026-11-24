# Trazer o site da Cuiabá FB Tabacaria para este projeto

O repositório público foi lido. É um site simples, sem banco de dados nem login, usando a mesma base técnica deste projeto, então a cópia é direta.

## O que o site tem
- Página inicial com a vitrine de produtos e cabeçalho com logo
- Carrinho de compras
- Página de finalização do pedido (checkout) com cálculo de entrega
- Um teste do cálculo de entrega

## O que será feito
1. Copiar todas as páginas, o cabeçalho, carrinho, lista de produtos, regra de entrega, estilos (cores e fontes) e o ícone do site, substituindo a página em branco atual.
2. Copiar as dependências do projeto original, mantendo as versões base deste projeto.
3. Trazer o logo: ele está guardado no projeto original; vou baixá-lo e salvá-lo neste projeto. Se não for possível, peço para você anexar o logo.
4. Verificar: rodar o teste de entrega, abrir a página inicial, adicionar um produto ao carrinho e chegar ao checkout.

Depois disso, podemos editar o que você quiser.

## Detalhes técnicos
- Fonte: clone em /tmp; copiar `src/` (exceto routeTree.gen.ts), `public/favicon.png`, `styles.css`, `AGENTS.md`/north-star relevantes.
- `src/assets/logo.png.asset.json` aponta para outro project_id; re-hospedar via lovable-assets.
- Sem Cloud, segredos ou integrações externas detectados.
