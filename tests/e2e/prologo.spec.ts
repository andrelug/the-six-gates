// Plays the prologue and Act 1 in the browser with the AI off (no API key), at desktop and phone width.
import { expect, test, type Page } from '@playwright/test';

const SAVE = 'sixgates:save:v1';

/** The side menu (places also have a "Cidade" back button, so scope to the menu). */
const menu = (page: Page) => page.getByRole('navigation', { name: 'Menu' });

async function semRolagemLateral(page: Page) {
  const [scroll, largura] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  expect(scroll).toBeLessThanOrEqual(largura);
}

/** A player who always moves the story forward: answers inputs, picks options, taps the chat bubble when the story waits for the world. */
async function jogar(page: Page, ate: (page: Page) => Promise<boolean>, lado = 'Ramos') {
  const opcoes = page.getByTestId('opcoes').getByRole('button');
  const campo = page.getByTestId('campo');
  const fab = page.getByRole('button', { name: 'Abrir conversa' }).first();
  const passoBotao = page.getByLabel('Próximo passo').getByRole('button');
  for (let i = 0; i < 2500; i++) {
    if (await ate(page)) return;
    const dica = (await page.getByTestId('dica').count()) ? await page.getByTestId('dica').innerText() : '';
    if (dica.startsWith('Digite e aperte Enter')) {
      const numero = (await campo.getAttribute('placeholder'))?.includes('número');
      await campo.fill(numero ? '34' : 'Ana');
      await campo.press('Enter');
    } else if ((await opcoes.count()) > 0) {
      const textos = await opcoes.allInnerTexts();
      const quer = [lado, 'casa da esquina', 'eletrônicos', 'Yang', 'Já ouvi'].map((t) => textos.findIndex((x) => x.includes(t))).find((n) => n >= 0);
      await opcoes.nth(quer ?? 0).click({ timeout: 3000 }).catch(() => {});
    } else if (await passoBotao.count()) {
      // idle or waiting for the world: the next-step bar's button does exactly what a player would tap
      await passoBotao.first().click({ timeout: 3000 }).catch(() => {});
    } else if (await fab.count()) {
      // the story waits for something in the world: open the bubble and use its shortcut
      await fab.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(350);
      await opcoes.first().click({ timeout: 3000 }).catch(() => {});
    }
    await page.waitForTimeout(60);
  }
  throw new Error('o jogo não chegou ao ponto esperado');
}

/** On a phone the chat is a sheet over the menu; close it like a player would. */
async function minimizar(page: Page) {
  const x = page.getByRole('button', { name: 'Minimizar' });
  await x.waitFor({ timeout: 3000 }).catch(() => {}); // the sheet may still be mounting after a reload
  if (await x.count()) await x.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

const naSemana1 = (p: Page) => p.getByText('Mensagem nova · Banco Lumen').first().isVisible();

test('joga o prólogo e o Ato 1, com cidade, missões e próximo passo, sem erros e sem rolagem lateral', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  // name the resource: the console only says "404", never which file
  page.on('response', (r) => void (r.status() >= 400 && !r.url().includes('/api/ai') && erros.push(`${r.status()} ${r.url()}`)));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('/api/ai') && !m.text().includes('503') && erros.push(`${m.text()} @ ${m.location().url}`));
  await page.goto('/?velocidade=25');
  await jogar(page, naSemana1);
  await expect(page.getByText('5/6')).toBeVisible(); // Propósito stays shut until the week is won
  await minimizar(page);
  // after the opening arc the bar only hints: it names the next thing and where it lives, with no button that does it
  const passo = page.getByLabel('Próximo passo');
  await expect(passo).toContainText('Aluguel do amigo');
  await expect(passo).toContainText('Mensagens');
  await expect(passo.getByRole('button')).toHaveCount(0);
  // the counter nobody explained is still on screen
  await expect(page.getByTitle('ações sem autorização')).toBeVisible();
  // the city is a real page; visiting a place reveals its missions, which can be gated by a rank
  await menu(page).getByRole('button', { name: 'Cidade', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cidade' })).toBeVisible();
  await page.getByRole('button', { name: /Academia do bairro/ }).click();
  await expect(page.getByRole('heading', { name: 'Academia do bairro' })).toBeVisible();
  const parceiro = page.locator('[data-missao="parceiro"]');
  await expect(parceiro).toContainText('Parceiro de treino');
  await expect(parceiro).toContainText('Corpo II');
  await expect(parceiro.getByRole('button', { name: 'Iniciar' })).toBeVisible(); // the opening arc already raised Corpo to II
  await semRolagemLateral(page);
  // the board and the profile show ranks
  await menu(page).getByRole('button', { name: 'Missões', exact: true }).click();
  await expect(page.getByText('Semana 1 · Provar o seu valor')).toBeVisible();
  await menu(page).getByRole('button', { name: 'Perfil', exact: true }).click();
  await expect(page.getByText(/Rank I/).first()).toBeVisible();
  // the mission lives in the inbox: answering Davi starts it and the chat opens (the bank's message is newer, so Davi's is the second)
  await menu(page).getByRole('button', { name: /Mensagens/ }).click();
  await page.getByRole('button', { name: 'Responder' }).nth(1).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText(/Davi aparece na sua porta/)).toBeVisible({ timeout: 20_000 });
  await semRolagemLateral(page);
  expect(erros).toEqual([]);
});

test('recarregar no meio volta ao mesmo ponto, com módulos e números', async ({ page }) => {
  await page.goto('/?velocidade=25');
  // stop when Bob's question is pending: the save already holds it, so the bot never answers it
  await jogar(page, async (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null')?.ui?.pendente?.opcoes?.some((o: { texto: string }) => o.texto.startsWith('Qual é a mensagem')) ?? false, SAVE));
  await minimizar(page);
  const credito = await page.getByText(/cr$/).first().innerText();
  await page.reload();
  await minimizar(page);
  await menu(page).getByRole('button', { name: 'Missões', exact: true }).click();
  await expect(page.getByText('Chegar a 55 de saúde')).toBeVisible();
  expect(await page.getByText(/cr$/).first().innerText()).toBe(credito);
  await semRolagemLateral(page);
});

test('texto livre sem a IA ainda escolhe a opção pelas palavras', async ({ page }) => {
  await page.goto('/?velocidade=25');
  await expect(page.getByTestId('opcoes').getByRole('button').first()).toBeVisible({ timeout: 30_000 });
  const campo = page.getByTestId('campo');
  await campo.fill('tá bom, vamos lá');
  await campo.press('Enter');
  await expect(page.getByText(/^Boa\. Ainda não sei/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Texto livre em modo offline')).toBeVisible();
});

test('a interface real: viajar pela cidade libera a história', async ({ page }) => {
  await page.goto('/?velocidade=25');
  // play until the story waits for the mall, then go there through the city map instead of the shortcut
  await jogar(page, async (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null')?.ui?.pendente?.id === 'ir_shopping', SAVE));
  await menu(page).getByRole('button', { name: 'Cidade', exact: true }).click();
  await page.getByRole('button', { name: /Shopping Lumen/ }).click();
  await expect(page.getByRole('heading', { name: /Shopping Lumen/ })).toBeVisible();
  await minimizar(page).catch(() => {});
  await page.getByRole('button', { name: 'Abrir conversa' }).first().click().catch(() => {});
  await expect(page.getByText('As lojas estão quase fechando')).toBeVisible({ timeout: 20_000 });
  await minimizar(page);
  await page.getByRole('tab', { name: /Ao vivo/ }).click();
  await expect(page.getByText("Mary").first()).toBeVisible();
});
