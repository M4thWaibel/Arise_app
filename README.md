# ARISE — Habit & Goal Tracker estilo "Sistema" de Solo Leveling

App mobile (Expo / React Native + TypeScript) construído **1:1 a partir do protótipo de design** em `../Arise/Arise.dc.html`. Toda a mecânica (XP, level-up, rank do caçador, classe, penalidade, dungeons, títulos) roda **localmente no aparelho** — não precisa de servidor. O progresso é salvo no dispositivo (AsyncStorage) e sobrevive a reinícios.

## Telas implementadas (exatamente como o protótipo)

- **Onboarding** (3 passos): "Você foi escolhido" → "Como o Sistema funciona" → "Quem é você?" (calibra atributos por idade/peso/sexo).
- **Status do Caçador** (home): janela de status com nível, rank E→S, classe, barra de XP, HP/MP/Fadiga, atributos.
- **Quests Diárias**: lista, check com XP flutuante, timer de reset, FAB para criar hábito.
- **Distribuir Pontos** (modal de level up): steppers + / − por atributo.
- **Penalidade**: tela vermelha com penalty quest, timer de 24 h e "limpar penalidade".
- **Dungeons**: lista por rank + detalhe com andares marcáveis.
- **Títulos & Conquistas**: grade de títulos bloqueados/desbloqueados.
- **Animações**: Level Up (flash + partículas), conclusão de quest (XP flutuante), penalidade (vinheta pulsante), barras com glow.

## Fase 2/3 — integrações nativas (exigem **dev build**, não Expo Go)

A partir da Fase 2 o app usa módulos nativos (notificações, Health Connect) — eles **não rodam no Expo Go**. Gere um **dev build / APK** via EAS (build na nuvem):

```powershell
npm install -g eas-cli         # ou npx eas-cli@latest
eas login                      # conta Expo grátis
eas build -p android --profile preview     # APK instalável (sideload)
# ou, para iterar com hot-reload nativo:
eas build -p android --profile development
```

O EAS dá um link → baixe/instale o APK no celular. (Build na nuvem — não depende do Gradle local.)

### O que a Fase 2/3 adiciona
- **Notificações locais** (`expo-notifications`): canais `system`/`penalty`/`ambient`, lembrete de quest 08:00 + reforço 20:00, e contador da penalidade (T−6h / T−1h). Permissão pedida no 1º boot.
- **Sincronização na nuvem** (opcional, additive): em **Configurações → Nuvem**, informe a URL do servidor Django, crie conta/entre. O app sincroniza por *snapshot* (last-write-wins) ao abrir e em background. Tokens JWT ficam no `expo-secure-store` (Keychain/Keystore). **Sem servidor, o app segue 100% offline.**
- **Health Connect** (Android): em "Novo hábito" defina uma **meta automática** (passos/sono/treino) — a quest se autocompleta e credita XP quando o Health Connect atinge a meta. Permissão concedida dentro do app Health Connect.
- **Soft-Lock — Selo do Sistema** (módulo nativo `modules/system-guard`): em **Configurações → Soft-Lock** sele apps de distração. Durante uma penalidade (ou um **Gate de Foco** voluntário), abrir um app selado sobe um overlay "Voltar ao Sistema" e **agrava o debuff** (+5%/infração, prazo +30 min). Gate de Foco concluído sem violar → XP de Percepção. Exige conceder **Acesso de Uso** + **Sobrepor apps** (a tela Apps Selados guia). Não usa Accessibility (seguro p/ política). Sem build nativo, a UI existe mas o bloqueio fica inativo (no-op).

### Conectar ao backend (sync)
1. Rode o backend (`../arise-backend`, ver README de lá) em `0.0.0.0:8000`.
2. No celular (mesma Wi-Fi), em Configurações → Nuvem, use `http://SEU_IP_LOCAL:8000` (ex.: `http://192.168.0.10:8000`).
3. Crie conta / entre → o app envia o estado local como backup; em outro aparelho, entrar restaura o estado da nuvem.

> Também dá para fixar a URL em build com `EXPO_PUBLIC_API_URL` no `.env`.

## Rodar no celular (Fase 1, sem nativo — Expo Go)

> Útil só para a UI da Fase 1. Notificações/Health Connect/sync exigem o dev build acima.


1. No celular, instale o app **Expo Go** (Play Store / App Store).
2. No PC, dentro de `arise-app`:
   ```powershell
   npm install      # só na primeira vez
   npx expo start
   ```
3. Garanta que **PC e celular estão na mesma rede Wi-Fi**. Escaneie o QR Code que aparece (Android: pela câmera do Expo Go; iOS: pela câmera do sistema).
4. Se a rede bloquear a conexão local, rode com túnel:
   ```powershell
   npx expo start --tunnel
   ```

> O app abrirá dentro do Expo Go. O progresso fica salvo nesse aparelho.

## Instalar como APK definitivo (sem Expo Go) — EAS Build na nuvem

Gera um `.apk` instalável que vira um app independente no celular. Requer uma conta gratuita Expo.

```powershell
npm install -g eas-cli      # ou use: npx eas-cli@latest
eas login                   # cria/loga na conta Expo (grátis)
eas build -p android --profile preview
```

Ao final, o EAS dá um **link**: abra-o no celular e baixe/instale o APK (ative "instalar de fontes desconhecidas" se pedir). Build feito na nuvem da Expo — não depende do Android Studio/Gradle local.

> O perfil `preview` (em `eas.json`) já está configurado para gerar **APK** (não AAB), ideal para sideload.

## Estrutura

```
src/
  app/                      rotas Expo Router
    _layout.tsx             fontes + hidratação do store + overlays globais
    index.tsx               gate: onboarding x app
    onboarding.tsx          fluxo de 3 passos
    main.tsx                troca de abas (Status/Quests/Dungeons/Títulos)
  components/
    SystemNav.tsx           barra de navegação inferior (HUD)
    screens/                Status, Quests, Dungeons, Títulos
    overlays/               LevelUp, Distribute, Penalty, DungeonDetail, CreateHabit, QuestXpFloat
    ui/                     ícones (SVG) e primitivos (barras, brackets)
  game/                     logic.ts (XP/rank/classe) + types.ts
  store/gameStore.ts        Zustand persistido — toda a regra de jogo
  theme/tokens.ts           cores, fontes e mapas (atributos, dificuldade, rank)
```

## Notas

- Fontes: Rajdhani (HUD), Chivo (corpo), JetBrains Mono (timers/mensagens do Sistema).
- O app começa com **conteúdo de exemplo** (quests, dungeons, títulos e uma penalidade pendente) — exatamente como o protótipo — para você ver tudo funcionando. Conclua/crie hábitos por cima.
- **Reset diário**: à meia-noite local, a conclusão das quests do dia é zerada automaticamente.
