# Points à vérifier

> Outil pédagogique, sans valeur réglementaire.

État au 2026-10-23 : 48 règles, 16 conséquences, 10 zones grises, 20 exemples. Toutes les entrées sont « à valider par l'équipe » (au moins une source officielle lue, avec extrait exact), **sauf OBL-PRRC et ZG-6** (« non vérifié »). Les listes ci-dessous sont produites à partir des données.

## Points généraux

1. **Texte des règlements (EUR-Lex) non lu.** Le défi anti-robot d'EUR-Lex est bloqué (voir `journal-sources.md`). Les dispositions du MDR sont pour l'instant fondées sur leur **citation en anglais** dans MDCG 2019-11 : article 2, points 1, 2 et 12 ; règle 11 ; règles d'application 3.3 et 3.5. À faire : recopier l'extrait **français** du MDR dans chaque source « MDR » et adapter le libellé des questions au texte officiel (par exemple « surveiller » ou « contrôler » des processus physiologiques).
2. **Version du MDR.** Confirmer la version consolidée courante (01/01/2026 ou 19/07/2026 ?) et vérifier si les actes modificatifs touchent l'annexe VIII ou l'article 52.
3. **AI Act modifié en 2026.** EUR-Lex affiche une version consolidée au 27/07/2026, postérieure à MDCG 2025-6 (juin 2025). Vérifier que la date d'application du 2 août 2027 (conséquence IA-HAUT-RISQUE) n'a pas changé.
4. **IMDRF N12 non lu.** Le tableau indicatif (R11-T1, R11-T2, R11-T-*) suit la reproduction de MDCG 2019-11, annexe III. Vérifier les numéros de section 5.1 et 5.2.
5. **Procédures par classe.** PROC-I et PROC-II-III indiquent si un organisme notifié intervient (vérifié dans MDCG 2025-6 et MDCG 2021-24), mais pas encore les annexes applicables à chaque classe (article 52 du MDR).
6. **Classe Im et logiciel.** Vérifier si un logiciel peut avoir une « fonction de mesure » au sens de la classe Im : un organisme notifié interviendrait alors en classe I.
7. **Traductions de travail.** Les questions traduisent des guides rédigés en anglais. Relire chaque formulation, surtout dans Q-6 (finalités de l'article 2, point 1) et R11-2.
8. **Choix pédagogiques de l'équipe, à assumer comme tels** (ce ne sont pas des règles juridiques) :
   - la liste de mots-clés du contrôle de cohérence (D-2 à D-4) ;
   - la classe du produit calculée comme le maximum des modules (AP-3.5 et ZG-8) ;
   - l'absence de questions pour les règles 9 et 10 (règle AUTRES).
9. **Changement par rapport au 1er passage.** R12 n'est plus posée comme une question : selon MDCG 2019-11 (section 4.2.2), un logiciel ne peut pas administrer de substance et relève de la règle d'application 3.3. Q-2 distingue maintenant le pilotage seul et le pilotage avec une finalité propre. Q-7 suit les étapes 2 et 3 de la figure 2. Nouvelles règles : R15 et le tableau indicatif de la règle 11. Nouvelles zones grises : ZG-8 à ZG-10.
10. **Zones grises construites par l'équipe.** ZG-1 à ZG-10 opposent des passages réels des sources. La présentation en « deux lectures » est une construction pédagogique à relire, en particulier ZG-8, qui transpose un exemple matériel à un logiciel modulaire.

## Entrées encore incomplètes

### Règles

| Id | Statut | Objet | Sources encore à lire |
|---|---|---|---|
| D-1 | à valider par l'équipe | Quelles revendications le fabricant fait-il pour ce logiciel ? Recopiez chaque revendicat… | MDR — Article 2, point 12 |
| Q-3 | à valider par l'équipe | Ce module, sans être lui-même un dispositif médical, est-il destiné par le fabricant à êt… | MDR — Article 2, point 2 |
| Q-6 | à valider par l'équipe | Quelle finalité médicale le fabricant attribue-t-il à ce module ? (plusieurs réponses pos… | MDR — Article 2, point 1 |
| AP-3.3 | à valider par l'équipe | Quelle est la classe du dispositif médical matériel que ce module pilote ou dont il influ… | MDR — Annexe VIII, chapitre II, point 3.3 |
| AP-3.3b | à valider par l'équipe | Logiciel indépendant de tout autre dispositif : il est classé en tant que tel. | MDR — Annexe VIII, chapitre II, point 3.3 |
| AP-ACC | à valider par l'équipe | Accessoire : il est traité indépendamment du dispositif avec lequel il est utilisé. | MDR — Annexe VIII, chapitre II, point 3.2 |
| R11-1 | à valider par l'équipe | Ce module est-il destiné à fournir des informations utilisées pour prendre des décisions … | MDR — Annexe VIII, chapitre III, règle 11 |
| R11-2 | à valider par l'équipe | Si une décision était prise sur la base d'une information erronée fournie par le module, … | MDR — Annexe VIII, chapitre III, règle 11 |
| R11-T1 | à valider par l'équipe | Aide indicative (tableau IMDRF) : quel est l'état de la situation de soins ou du patient ? | IMDRF-N12 — Section 5.2 (état de la situation de soins) |
| R11-T2 | à valider par l'équipe | Aide indicative (tableau IMDRF) : quelle est l'importance de l'information fournie dans l… | IMDRF-N12 — Section 5.1 (importance de l'information) |
| R11-3 | à valider par l'équipe | Ce module est-il destiné uniquement à surveiller (monitorer) des processus physiologiques… | MDR — Annexe VIII, chapitre III, règle 11 |
| AP-3.5 | à valider par l'équipe | agregation_classes ; Quand plusieurs règles ou sous-règles s'appliquent au même dispositi… | MDR — Annexe VIII, chapitre II, point 3.5 |
| K-I | à valider par l'équipe | consequence | MDR — Article 52, paragraphe 7 |
| K-IIa | à valider par l'équipe | consequence | MDR — Article 52, paragraphe 6 |
| K-IIb | à valider par l'équipe | consequence | MDR — Article 52, paragraphe 4 |
| K-III | à valider par l'équipe | consequence ; consequence | MDR — Article 52, paragraphe 3 |
| IA-1 | à valider par l'équipe | Le produit intègre-t-il un système d'intelligence artificielle, c'est-à-dire un système a… | AIA — Article 3, point 1 |
| IA-2 | à valider par l'équipe | consequence | AIA — Article 6, paragraphe 1 ; annexe I, section A |
| IA-3 | à valider par l'équipe | consequence ; zone_grise | AIA — Article 6, paragraphe 1 |

### Conséquences

| Id | Statut | Objet | Sources encore à lire |
|---|---|---|---|
| PROC-I | à valider par l'équipe | Classe I : pas d'organisme notifié | MDR — Article 52, paragraphe 7 |
| PROC-II-III | à valider par l'équipe | Classes IIa, IIb et III : intervention d'un organisme notifié | MDR — Article 52, paragraphes 3 à 6 |
| OBL-SMQ | à valider par l'équipe | Démarche qualité et gestion des risques | MDR — Article 10 |
| OBL-PRRC | non vérifié | Personne chargée de veiller au respect de la réglementation | MDR — Article 15 |
| OBL-CYBER | à valider par l'équipe | Cybersécurité | MDR — Annexe I, point 17 |
| OBL-CE | à valider par l'équipe | Marquage CE | MDR — Articles 19 et 20 |
| IA-HAUT-RISQUE | à valider par l'équipe | AI Act : système d'IA à haut risque | AIA — Article 6, paragraphe 1 ; article 113 |

### Zones grises

| Id | Statut | Objet | Sources encore à lire |
|---|---|---|---|
| ZG-6 | non vérifié | IA dans un logiciel de classe I : uniquement les obligations générales ? | AIA — Article 6, paragraphe 2 ; annexe III |
