import { useContext, createContext } from 'react';
import { T } from '../data/i18n';
// Contextos globais da aplicacao.
// LangCtx guarda o idioma; useT() devolve os textos ja no idioma certo.
const LangCtx = createContext('pt');

const TweakCtx = createContext({});

function useT() {
  const lang = useContext(LangCtx);
  return T[lang];
}

export { LangCtx, TweakCtx, useT };
