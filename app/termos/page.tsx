import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Termos de Uso — Nexa",
  description: "Condições de uso do Nexa durante o período de beta fechado.",
};

/**
 * Termos de uso.
 *
 * Escrito em linguagem direta de propósito: o público é pessoa física com
 * pouca familiaridade financeira, e termo que ninguém entende não protege
 * ninguém — nem o usuário nem você.
 *
 * NÃO substitui revisão jurídica. É a base honesta para um beta fechado; antes
 * de cobrar ou abrir ao público, um advogado precisa revisar.
 */
export default function TermosPage() {
  return (
    <main className="min-h-[100dvh] bg-neutral-950 text-neutral-200">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Termos de Uso</h1>
        <p className="text-sm text-neutral-500 mb-10">Versão de 2 de outubro de 2026</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          <Secao titulo="1. O que é o Nexa">
            <p>
              O Nexa é um aplicativo de controle financeiro pessoal. Ele ajuda você a registrar o que ganha e gasta, acompanhar dívidas e planejar reservas e metas.
            </p>
            <p className="mt-3">
              Hoje o Nexa está em <strong className="text-white">beta fechado</strong>: o acesso é por convite, o uso é gratuito e o produto está em desenvolvimento ativo. Funcionalidades podem mudar ou ser removidas.
            </p>
          </Secao>

          <Secao titulo="2. O Nexa não é consultoria financeira">
            <p>
              As análises, projeções e sugestões do app — incluindo as geradas por inteligência artificial — são <strong className="text-white">ferramentas de apoio</strong>, não recomendação profissional de investimento, crédito ou planejamento.
            </p>
            <p className="mt-3">
              Toda projeção é estimativa baseada nos dados que você mesmo lançou. Decisões financeiras são suas, e recomendamos consultar um profissional habilitado antes de decisões relevantes.
            </p>
          </Secao>

          <Secao titulo="3. Sua conta">
            <p>
              Você é responsável por manter sua senha em segurança e pelo que acontece na sua conta. O convite do beta é nominal: não o repasse a terceiros.
            </p>
            <p className="mt-3">
              Você é responsável também pela veracidade do que lança. O app calcula sobre os dados que recebe — informação errada produz diagnóstico errado.
            </p>
          </Secao>

          <Secao titulo="4. Disponibilidade">
            <p>
              Durante o beta não há garantia de disponibilidade contínua, nem compromisso de tempo de resposta. O serviço pode ficar fora do ar para manutenção ou correção, sem aviso prévio.
            </p>
            <p className="mt-3">
              Mantenha seus próprios registros do que considerar importante. Você pode exportar seus dados a qualquer momento pelo app.
            </p>
          </Secao>

          <Secao titulo="5. Uso aceitável">
            <p>Ao usar o Nexa, você concorda em não:</p>
            <ul className="list-disc pl-5 mt-3 flex flex-col gap-1.5 text-neutral-300">
              <li>tentar acessar dados de outros usuários;</li>
              <li>usar o app para atividade ilegal;</li>
              <li>sobrecarregar a infraestrutura de forma automatizada;</li>
              <li>copiar ou redistribuir o aplicativo sem autorização.</li>
            </ul>
          </Secao>

          <Secao titulo="6. Encerramento">
            <p>
              Você pode excluir sua conta a qualquer momento, nas configurações do app. A exclusão remove seus dados financeiros dos nossos servidores e é irreversível.
            </p>
            <p className="mt-3">
              Podemos encerrar o acesso de contas que violem estes termos, com aviso quando possível.
            </p>
          </Secao>

          <Secao titulo="7. Mudanças nestes termos">
            <p>
              Se estes termos mudarem de forma relevante, pediremos novo aceite dentro do app antes de você continuar usando.
            </p>
          </Secao>

          <Secao titulo="8. Contato">
            <p>
              Dúvidas sobre estes termos podem ser enviadas pelo canal de feedback dentro do aplicativo.
            </p>
          </Secao>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10">
          <Link href="/privacidade" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Ver a política de privacidade →
          </Link>
        </div>
      </div>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-white mb-2.5">{titulo}</h2>
      <div className="text-neutral-400">{children}</div>
    </section>
  );
}
