import type { EtapaTurma } from "@/lib/etapa";
import { getShowcaseProjectById } from "@/lib/project-showcase";
import { PedagogicalDocumentExportService, type ExportFormat } from "@/services/pedagogical-document-export.service";
import { ProjetoRepository } from "@/repositories/projeto.repository";

export class ProjetoService {
  private readonly projetoRepository = new ProjetoRepository();

  private readonly exportService = new PedagogicalDocumentExportService();

  async list(
    userId: string,
    filters: {
      categoria?: string;
      faixaEtaria?: string;
      etapa?: EtapaTurma;
      duracao?: string;
      busca?: string;
      salvos?: boolean;
      origem?: "CATALOGO" | "IMPORTADO";
      includeAtividades?: boolean;
      cursor?: string;
      limit?: number;
    },
  ) {
    return this.projetoRepository.listPaginated(userId, {
      ...filters,
    });
  }

  async detail(userId: string, id: string) {
    const projeto = await this.projetoRepository.findById(userId, id);

    const saved = await this.projetoRepository.isSaved(userId, id);

    return {
      ...projeto,
      premium: false,
      salvo: saved,
      premiumBloqueado: false,
    };
  }

  async save(userId: string, projetoId: string) {
    return this.projetoRepository.save(userId, projetoId);
  }

  async unsave(userId: string, projetoId: string) {
    return this.projetoRepository.unsave(userId, projetoId);
  }

  async exportDocument(userId: string, id: string, format: ExportFormat) {
    const localProject = getShowcaseProjectById(id);

    if (localProject) {
      return this.exportService.exportProject(localProject, format);
    }

    const projeto = await this.detail(userId, id);
    return this.exportService.exportProject(projeto, format);
  }
}
