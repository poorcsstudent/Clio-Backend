import { reliableGuidanceFix, type TourVoiceContext } from './tourGuidance';

/** Vision supplies landmark context only. It never creates a navigation edge or heading. */
export function cameraDirectionAnswer(name: string | null, capturedTourId: string, current: TourVoiceContext | null, now = Date.now()) {
  const landmark = name ? `The view may show ${name}; that identification is not confirmed.` : 'I could not confidently match a landmark in this view.';
  const limits = 'A single photo does not establish which way you are facing or whether a road is safe to cross.';
  if (!current?.active || current.paused || current.tourId !== capturedTourId) return `${landmark} ${limits} The tour changed or paused; ask for directions again when ready.`;
  if (!current.position || !reliableGuidanceFix(current.position, now)) return `${landmark} ${limits} Your position is uncertain, so I will not give a turn. Follow posted pedestrian signs and wait for a fresh GPS fix.`;
  if (!current.onRoute) return `${landmark} ${limits} I cannot confirm you are on the active mapped path. Stop in a suitable place and check posted signs or the optional map; do not cross a road just to rejoin the route.`;
  return `${landmark} ${limits} Separately, the mapped route says: ${current.instruction} Left and right refer to travel along that route, not the camera view.`;
}
