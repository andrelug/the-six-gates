export interface PedidoIA {
  mode: 'classificar' | 'conversar';
  texto: string;
  opcoes: string[];
  /** Who is talking: the original AI, the cracked one (faction) or the government officer. */
  guia: 'ia' | 'faccao' | 'governo';
  estado: Record<string, unknown>;
  historico: string[];
}

export interface RespostaIA {
  escolha: number | null;
  /** In-character text, or null when the client should use the canned reply from the script. */
  resposta: string | null;
  motivo?: 'limite';
}

/** null = the AI is unreachable (no key, no network, server error): the game falls back to canned replies. */
export type ChamarIA = (pedido: PedidoIA) => Promise<RespostaIA | null>;
