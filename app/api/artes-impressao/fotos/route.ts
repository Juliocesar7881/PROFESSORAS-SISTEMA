import { ArtesImpressaoController } from "@/controllers/artes-impressao.controller";
import { route, withAuth } from "@/middleware/api";

const controller = new ArtesImpressaoController();

export const GET = route(controller.listPhotos, [withAuth]);
