# Leilão de Futebol

## Como usar
1. Extraia a pasta.
2. Publique todos os arquivos na raiz do seu repositório GitHub.
3. Ative o GitHub Pages em Settings > Pages.
4. Abra o site publicado e entre em **Salas**.
5. O anfitrião cria a sala e compartilha o código `LF-XXXXXX`.
6. Os amigos entram com o código. O anfitrião inicia o leilão.

## Arquitetura
- Front-end estático hospedado no GitHub Pages.
- PeerJS/WebRTC para conexão direta entre os navegadores.
- Não usa banco de dados.
- O anfitrião mantém o estado da partida e precisa permanecer conectado. O anfitrião e os convidados precisam deixar a página aberta.

## Limitações
A sinalização é feita pelo serviço público do PeerJS. Algumas redes podem bloquear conexões P2P; para maior compatibilidade pode ser necessário configurar um servidor TURN. Se o anfitrião fechar a página ou perder a conexão, a sala para. O jogo é um protótipo multiplayer e não possui proteção robusta contra trapaças.

## Arquivos
- `index.html`: página inicial.
- `Sala.html`, `sala.css`, `sala.js`: criação e entrada nas salas.
- `leilao.html`, `leilao.css`, `leilao.js`: lances, elencos e simulação.
- `script_jogadores.js`: lista de jogadores.
- `escalação.html`, `escalação.css`, `escalação.js`: página de escalação original.
