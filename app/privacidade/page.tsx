import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade — Nexa",
  description: "Como o Nexa trata seus dados financeiros, conforme a LGPD.",
};

/**
 * Política de privacidade.
 *
 * Descreve o tratamento REAL de dados — quem processa, onde ficam, o que sai
 * para terceiros. Política genérica copiada de modelo é pior que nenhuma:
 * cria obrigação que o produto não cumpre.
 *
 * Os pontos aqui foram escritos a partir do que o app de fato faz hoje:
 * Supabase como banco e autenticação, Vercel como hospedagem, Google Gemini
 * quando os recursos de IA estiverem ligados.
 *
 * NÃO substitui revisão jurídica antes de cobrar ou abrir ao público.
 */
export default function PrivacidadePage() {
  return (
    <main className="min-h-[100dvh] bg-neutral-950 text-neutral-200">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidade</h1>
        <p className="text-sm text-neutral-500 mb-10">Versão de 2 de outubro de 2026</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          <Secao titulo="1. Resumo honesto">
            <p>
              O Nexa guarda o que você lança: receitas, despesas, dívidas, metas e comprovantes. Esses dados são usados <strong className="text-white">para gerar o seu diagnóstico financeiro</strong> e nada mais.
            </p>
            <p className="mt-3">
              Não vendemos seus dados. Não usamos para publicidade. Não compartilhamos com terceiros além dos prestadores técnicos listados abaixo.
            </p>
          </Secao>

          <Secao titulo="2. Que dados coletamos">
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-neutral-300">
              <li><strong className="text-white">Cadastro:</strong> e-mail e senha (a senha é guardada de forma criptografada e nunca temos acesso a ela).</li>
              <li><strong className="text-white">Perfil financeiro:</strong> renda declarada, tipo de renda, se possui dívida e seu objetivo.</li>
              <li><strong className="text-white">Lançamentos:</strong> receitas, despesas, categorias, datas, carteiras e parcelamentos.</li>
              <li><strong className="text-white">Dívidas e patrimônio:</strong> saldos, taxas e posições que você cadastrar.</li>
              <li><strong className="text-white">Comprovantes:</strong> fotos e arquivos que você anexar.</li>
              <li><strong className="text-white">Erros técnicos:</strong> mensagens de falha do aplicativo, para corrigirmos problemas.</li>
            </ul>
            <p className="mt-3">
              Não coletamos CPF, dados bancários, número de cartão nem localização.
            </p>
          </Secao>

          <Secao titulo="3. Onde seus dados ficam">
            <p>Usamos estes prestadores técnicos:</p>
            <ul className="list-disc pl-5 mt-3 flex flex-col gap-1.5 text-neutral-300">
              <li><strong className="text-white">Supabase</strong> — banco de dados, autenticação e armazenamento dos comprovantes.</li>
              <li><strong className="text-white">Vercel</strong> — hospedagem do aplicativo.</li>
              <li>
                <strong className="text-white">Google (Gemini)</strong> — apenas quando os recursos de inteligência artificial estiverem ativos. Nesse caso, um resumo dos seus números é enviado para gerar a análise.
                {' '}<span className="text-neutral-500">Durante o beta, esses recursos estão desativados.</span>
              </li>
            </ul>
            <p className="mt-3">
              Esses serviços podem processar dados fora do Brasil. Ao usar o Nexa, você concorda com essa transferência internacional, prevista no art. 33 da LGPD.
            </p>
          </Secao>

          <Secao titulo="4. Quem pode ver seus dados">
            <p>
              Cada usuário só enxerga os próprios dados. Isso é garantido no banco por regras de acesso por linha, não apenas na tela — ou seja, não adianta burlar o aplicativo.
            </p>
            <p className="mt-3">
              O administrador do Nexa tem acesso a <strong className="text-white">estatísticas agregadas</strong> (quantidade de lançamentos, volume total) e ao seu e-mail, para suporte e operação. Não lemos o conteúdo dos seus lançamentos individuais no uso normal.
            </p>
          </Secao>

          <Secao titulo="5. Seus direitos (LGPD)">
            <p>Você pode, a qualquer momento:</p>
            <ul className="list-disc pl-5 mt-3 flex flex-col gap-1.5 text-neutral-300">
              <li><strong className="text-white">Acessar</strong> todos os seus dados dentro do app.</li>
              <li><strong className="text-white">Corrigir</strong> qualquer lançamento ou informação de perfil.</li>
              <li><strong className="text-white">Exportar</strong> seus dados em formato aberto, pelas configurações.</li>
              <li><strong className="text-white">Excluir</strong> sua conta e todos os dados, de forma irreversível, pelas configurações.</li>
            </ul>
            <p className="mt-3">
              A exclusão é imediata e definitiva: não mantemos cópia dos seus dados financeiros após ela, salvo o que a lei exigir.
            </p>
          </Secao>

          <Secao titulo="6. Segurança">
            <p>
              Usamos conexão criptografada, autenticação gerenciada pelo Supabase e isolamento de dados por usuário no banco. Comprovantes ficam em armazenamento privado, acessível apenas por link temporário gerado para você.
            </p>
            <p className="mt-3">
              Nenhum sistema é totalmente imune. Se houver incidente que exponha seus dados, avisaremos você e a autoridade competente, como manda a LGPD.
            </p>
          </Secao>

          <Secao titulo="7. Por quanto tempo guardamos">
            <p>
              Enquanto sua conta existir. Ao excluí-la, os dados são removidos. Registros de erro técnico são mantidos por até 90 dias para diagnóstico.
            </p>
          </Secao>

          <Secao titulo="8. Contato">
            <p>
              Para exercer seus direitos ou tirar dúvidas sobre esta política, use o canal de feedback dentro do aplicativo.
            </p>
          </Secao>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10">
          <Link href="/termos" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Ver os termos de uso →
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
