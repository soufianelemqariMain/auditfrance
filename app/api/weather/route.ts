// TODO: Intégrer l'API officielle Météo-France opendata lorsque les clés sont disponibles

export async function GET(_request: Request): Promise<Response> {
  const data = {
    vigipirate: "SECURITE_RENFORCEE",
    alerts: [
      {
        department: "75",
        level: "orange",
        phenomenon: "vent",
        description: "Vents forts attendus en Île-de-France",
      },
      {
        department: "13",
        level: "jaune",
        phenomenon: "chaleur",
        description: "Vigilance chaleur dans le Var",
      },
      {
        department: "76",
        level: "rouge",
        phenomenon: "pluie-inondation",
        description: "Fortes précipitations en Seine-Maritime",
      },
    ],
    fetchedAt: new Date().toISOString(),
  };

  return Response.json(data);
}
