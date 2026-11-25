import { useState, useEffect } from 'react';
import { WorshipService } from '../../types';
import { SupportedLanguage } from '../../i18n/types';
import { TranslationService } from './TranslationService';

interface LocalizedWorshipContent {
  title: string;
  summary: string;
  full_transcript: string;
  tags: string;
}

/**
 * Traduções nativas instantâneas (0ms / 100% offline) para os 11 cultos iniciais cadastrados no seeds.ts.
 * Assim, ao alternar o idioma do aplicativo no topo, todos os cultos de demonstração mudam imediatamente
 * tanto na leitura visual quanto na narração por voz (TTS), mesmo sem baixar pacotes ML Kit.
 */
const SEEDED_WORSHIP_TRANSLATIONS: Record<string, Partial<Record<SupportedLanguage, LocalizedWorshipContent>>> = {
  'O Poder da Fé em Tempos Difíceis': {
    en: {
      title: 'The Power of Faith in Difficult Times',
      summary: 'An encouraging message about keeping our eyes fixed on the promise even in the midst of the storm.',
      full_transcript: 'Good evening, brothers and sisters. Today we will meditate on Hebrews 11:1. Faith is not the absence of passing doubts, but the firm conviction that God cares for every detail. When we look at the story of the heroes of faith, we see that perseverance produces hope. Trust in the Lord even when the path seems uncertain.',
      tags: 'Faith, Hope, Perseverance'
    },
    es: {
      title: 'El Poder de la Fe en Tiempos Difíciles',
      summary: 'Un mensaje alentador sobre mantener los ojos fijos en la promesa incluso en medio de la tormenta.',
      full_transcript: 'Buenas noches a todos los hermanos. Hoy vamos a meditar en Hebreos 11:1. La fe no es la ausencia de dudas pasajeras, sino la firme convicción de que Dios cuida cada detalle. Cuando miramos la historia de los héroes de la fe, percibimos que la perseverancia produce esperanza. Confía en el Señor aunque el camino parezca incierto.',
      tags: 'Fe, Esperanza, Perseverancia'
    },
    fr: {
      title: 'La Puissance de la Foi dans les Temps Difficiles',
      summary: 'Un message encourageant pour garder les yeux fixés sur la promesse même au milieu de la tempête.',
      full_transcript: 'Bonsoir à tous les frères et sœurs. Aujourd\'hui nous allons méditer sur Hébreux 11:1. La foi n\'est pas l\'absence de doutes passagers, mais la ferme conviction que Dieu prend soin de chaque détail. En regardant les héros de la foi, nous voyons que la persévérance produit l\'espérance. Fais confiance au Seigneur même lorsque le chemin semble incertain.',
      tags: 'Foi, Espérance, Persévérance'
    },
    sw: {
      title: 'Nguvu ya Imani Wakati wa Shida',
      summary: 'Ujumbe wa kutia moyo juu ya kuweka macho yetu kwenye ahadi hata katikati ya dhoruba.',
      full_transcript: 'Habari za jioni ndugu wote. Leo tutatafakari Waebrania 11:1. Imani si kukosa shaka za muda, bali ni uhakika thabiti kwamba Mungu anatunza kila jambo. Tunapoangalia mashujaa wa imani, tunaona kwamba uvumilivu huzaa tumaini. Mtumaini Bwana hata njia inapoonekana kutokuwa wazi.',
      tags: 'Imani, Tumaini, Uvumilivu'
    },
    ts: {
      title: 'Matimba ya Ripfumelo hi Nkarhi wa Maxangu',
      summary: 'Mahungu yo tiyisa nhlana yo languta eka xitshembiso hambi exikarhi ka xidzedze.',
      full_transcript: 'Riperile vamakwerhu hinkwenu. Namuntlha hi ta anakanya hi Vaheveru 11:1. Ripfumelo i ku tiyiseka leswaku Xikwembu xa hi hlayisa eka hinkwaswo. Tshemba Hosi hambi loko ndlela yi vonaka yi tika.',
      tags: 'Ripfumelo, Ntshembo, Ku Tiyisela'
    }
  },
  'O Amor Incondicional do Pai': {
    en: {
      title: 'The Unconditional Love of the Father',
      summary: 'A reflection on the depth of divine love expressed in the giving of His only begotten Son.',
      full_transcript: 'God\'s grace reached us not by our works, but through His immeasurable love. As we read in John 3:16, He loved the world so much that He gave everything for us. This love casts out fear and restores every heart that draws near with sincerity.',
      tags: 'Grace, Love, Salvation'
    },
    es: {
      title: 'El Amor Incondicional del Padre',
      summary: 'Reflexión sobre la dimensión del amor divino expresado en la entrega del Hijo unigénito.',
      full_transcript: 'La gracia de Dios nos alcanzó no por nuestras obras, sino por Su amor inconmensurable. Como leemos en Juan 3:16, Él amó tanto al mundo que entregó todo por nosotros. Ese amor echa fuera el temor y restaura cualquier corazón que se acerca con sinceridad.',
      tags: 'Gracia, Amor, Salvación'
    },
    fr: {
      title: 'L\'Amour Inconditionnel du Père',
      summary: 'Réflexion sur la profondeur de l\'amour divin manifesté par le don de Son Fils unique.',
      full_transcript: 'La grâce de Dieu nous a atteints non par nos œuvres, mais par Son amour incommensurable. Comme nous le lisons dans Jean 3:16, Il a tellement aimé le monde qu\'Il a tout donné pour nous. Cet amour chasse la peur et restaure tout cœur qui s\'approche avec sincérité.',
      tags: 'Grâce, Amour, Salut'
    },
    sw: {
      title: 'Upendo Usio na Masharti wa Baba',
      summary: 'Tafakari juu ya kina cha upendo wa Mungu uliodhihirishwa kwa kumtoa Mwanawe wa pekee.',
      full_transcript: 'Neema ya Mungu ilitufikia si kwa matendo yetu, bali kwa upendo Wake usiopimika. Kama tunavyosoma katika Yohana 3:16, aliupenda ulimwengu kiasi cha kutoa kila kitu kwa ajili yetu. Upendo huu huondoa hofu na kuponya kila moyo.',
      tags: 'Neema, Upendo, Wokovu'
    },
    ts: {
      title: 'Rirhandzu leri Nga Heriki ra Tatana',
      summary: 'Ku anakanya hi rirhandzu ra Xikwembu hi ku nyiketa N\'wana wa xona.',
      full_transcript: 'Tintswalo ta Xikwembu ti hi fikelerile hi rirhandzu ra xona. Hilaha hi hlayaka eka Yohane 3:16, xi rhandzile misava swinene. Rirhandzu leri ri susa ku chava eka mbilu yin\'wana ni yin\'wana.',
      tags: 'Tintswalo, Rirhandzu, Ku Ponisiwa'
    }
  },
  'Descanso nas Águas Tranquilas': {
    en: {
      title: 'Rest Beside Still Waters',
      summary: 'How to find inner peace and mental rest in the rush of everyday life.',
      full_transcript: 'We live in a hyperconnected and often exhausted world. Psalms 23:1 reminds us: The Lord is my shepherd; I shall not want. He leads us beside still waters to restore our soul. Pause today for a few minutes and surrender your anxieties before Him.',
      tags: 'Peace, Psalms, Rest'
    },
    es: {
      title: 'Descanso junto a Aguas Tranquilas',
      summary: 'Cómo encontrar paz interior y descanso mental en la prisa del día a día.',
      full_transcript: 'Vivimos en un mundo hiperconectado y muchas veces agotado. Salmos 23:1 nos recuerda: El Señor es mi pastor y nada me faltará. Él nos guía junto a aguas de reposo para restaurar el alma. Detente hoy unos minutos y entrega tus ansiedades delante de Él.',
      tags: 'Paz, Salmos, Descanso'
    },
    fr: {
      title: 'Repos près des Eaux Paisibles',
      summary: 'Comment trouver la paix intérieure et le repos de l\'esprit dans le rythme quotidien.',
      full_transcript: 'Nous vivons dans un monde hyperconnecté et souvent épuisé. Psaumes 23:1 nous rappelle : L\'Éternel est mon berger, je ne manquerai de rien. Il nous conduit près des eaux paisibles pour restaurer notre âme. Prenez quelques minutes aujourd\'hui pour Lui confier vos inquiétudes.',
      tags: 'Paix, Psaumes, Repos'
    },
    sw: {
      title: 'Pumziko Kando ya Maji ya Utulivu',
      summary: 'Jinsi ya kupata amani ya ndani na pumziko la akili katikati ya shughuli za kila siku.',
      full_transcript: 'Tunaishi katika ulimwengu wenye shughuli nyingi na uchovu. Zaburi 23:1 inatukumbusha: Bwana ndiye mchungaji wangu, sitapungukiwa na kitu. Hutuongoza kando ya maji ya utulivu ili kuhuisha nafsi zetu.',
      tags: 'Amani, Zaburi, Pumziko'
    },
    ts: {
      title: 'Ku Wisa eMatini yo Rhula',
      summary: 'Ndlela yo kuma ku rhula endzeni ka mbilu masiku hinkwawo.',
      full_transcript: 'Tinsimu 23:1 yi hi tsundzuxa leswaku Yehovha i murisi wa mina, ndzi nga ka ndzi nga pfumali nchumu. U hi kongomisa eka mati yo rhula ku wisa moya wa hina.',
      tags: 'Ku Rhula, Tinsimu, Ku Wisa'
    }
  },
  'Todas as Coisas Cooperam': {
    en: {
      title: 'All Things Work Together for Good',
      summary: 'Understanding God\'s purpose behind seasons of pain and learning.',
      full_transcript: 'In Romans 8:28 we find one of the most comforting declarations in Scripture. All things, including cloudy days and goodbyes, work together for the good of those who love God. Do not lose heart over today\'s chapter, for the story is not over yet.',
      tags: 'Purpose, Romans, Victory'
    },
    es: {
      title: 'Todas las Cosas Ayudan a Bien',
      summary: 'Comprendiendo el propósito de Dios detrás de los momentos de dolor y aprendizaje.',
      full_transcript: 'En Romanos 8:28 tenemos una de las declaraciones más consoladoras de las Escrituras. Todas las cosas, incluso los días nublados y las despedidas, cooperan para el bien de quienes aman a Dios. No te desanimes con el capítulo de hoy, porque la historia aún no termina.',
      tags: 'Propósito, Romanos, Victoria'
    },
    fr: {
      title: 'Toutes Choses Concourent au Bien',
      summary: 'Comprendre le dessein de Dieu derrière les moments d\'épreuve et d\'apprentissage.',
      full_transcript: 'Dans Romains 8:28 nous avons l\'une des déclarations les plus consolantes des Écritures. Toutes choses, y compris les jours sombres, concourent au bien de ceux qui aiment Dieu. Ne vous découragez pas, car l\'histoire n\'est pas encore terminée.',
      tags: 'Dessein, Romains, Victoire'
    },
    sw: {
      title: 'Mambo Yote Hufanya Kazi Pamoja kwa Wema',
      summary: 'Kuelewa kusudi la Mungu nyuma ya nyakati za maumivu na kujifunza.',
      full_transcript: 'Katika Warumi 8:28 tuna tangazo la faraja kubwa. Mambo yote hufanya kazi pamoja kwa wema kwa wale wampendao Mungu. Usikate tamaa leo, kwa sababu hadithi yako haijaisha.',
      tags: 'Kusudi, Warumi, Ushindi'
    },
    ts: {
      title: 'Hinkwaswo Swi Tirhela Leswinene',
      summary: 'Ku twisisa xikongomelo xa Xikwembu eminkarhini yo tika.',
      full_transcript: 'Eka Varhoma 8:28 hi dyondza leswaku swilo hinkwaswo swi tirhela leswinene eka lava rhandzaka Xikwembu. U nga heli matimba namuntlha.',
      tags: 'Xikongomelo, Varhoma, Ku Hlula'
    }
  },
  'Renovação de Forças e Ânimo': {
    en: {
      title: 'Renewal of Strength and Courage',
      summary: 'Overcoming spiritual exhaustion through fellowship and constant prayer.',
      full_transcript: 'How many times do we feel our energy has run dry? The prophet Isaiah in chapter 40 verse 31 declares that those who wait upon the Lord shall mount up with wings as eagles. His strength is made perfect in our weakness.',
      tags: 'Strength, Isaiah, Prayer'
    },
    es: {
      title: 'Renovación de Fuerzas y Ánimo',
      summary: 'Superando el cansancio espiritual a través de la comunión y la oración constante.',
      full_transcript: '¿Cuántas veces sentimos que nuestras energías se agotaron? El profeta Isaías 40:31 declara que los que esperan en el Señor levantarán alas como las águilas. Su poder se perfecciona en nuestra debilidad.',
      tags: 'Fuerza, Isaías, Oración'
    },
    fr: {
      title: 'Renouvellement de Forces et de Courage',
      summary: 'Surmonter la fatigue spirituelle par la communion et la prière constante.',
      full_transcript: 'Combien de fois sentons-nous nos forces s\'épuiser ? Le prophète Ésaïe 40:31 déclare que ceux qui se confient en l\'Éternel renouvellent leur force et prennent leur envol comme les aigles.',
      tags: 'Force, Ésaïe, Prière'
    },
    sw: {
      title: 'Kufanywa Upya Nguvu na Ujasiri',
      summary: 'Kushinda uchovu wa kiroho kupitia ushirika na maombi ya kudumu.',
      full_transcript: 'Nabii Isaya 40:31 anatangaza kuwa wale wamngojeao Bwana watapata nguvu mpya na kupaa kwa mbawa kama tai. Nguvu Zake hukamilika katika udhaifu wetu.',
      tags: 'Nguvu, Isaya, Maombi'
    },
    ts: {
      title: 'Ku Pfuxetiwa ka Matimba',
      summary: 'Ku hlula ku karhala hi xikhongelo lexi nga heriki.',
      full_transcript: 'Muprofeta Esaya 40:31 u ri lava tshembaka Hosi va ta pfuxetiwa matimba ya vona va haha ku fana ni magama.',
      tags: 'Matimba, Esaya, Xikhongelo'
    }
  },
  'Prioridades do Reino': {
    en: {
      title: 'Priorities of the Kingdom',
      summary: 'Aligning our routine, desires and finances with the eternal values of the Gospel.',
      full_transcript: 'In Matthew 6:33 Jesus invites us to reorder our lives: seek first the Kingdom of God and His righteousness. When we place God at the center, secondary worries fall into their proper place.',
      tags: 'Kingdom, Matthew, Priorities'
    },
    es: {
      title: 'Prioridades del Reino',
      summary: 'Alineando nuestra rutina, deseos y finanzas con los valores eternos del Evangelio.',
      full_transcript: 'En Mateo 6:33 Jesús nos invita a reordenar la vida: buscad primeramente el Reino de Dios y su justicia. Cuando ponemos a Dios en el centro, las preocupaciones secundarias encuentran su debido lugar.',
      tags: 'Reino, Mateo, Prioridades'
    },
    fr: {
      title: 'Les Priorités du Royaume',
      summary: 'Aligner notre quotidien, nos désirs et nos choix sur les valeurs éternelles de l\'Évangile.',
      full_transcript: 'Dans Matthieu 6:33 Jésus nous invite à réorganiser notre vie : cherchez premièrement le Royaume et la justice de Dieu. Quand Dieu est au centre, tout le reste trouve sa juste place.',
      tags: 'Royaume, Matthieu, Priorités'
    },
    sw: {
      title: 'Vipaumbele vya Ufalme',
      summary: 'Kupanga maisha yetu na maamuzi kulingana na maadili ya milele ya Injili.',
      full_transcript: 'Katika Mathayo 6:33 Yesu anatualika kutafuta kwanza Ufalme wa Mungu na haki yake. Tunapomweka Mungu katikati, mahangaiko mengine hupata mahali pake.',
      tags: 'Ufalme, Mathayo, Vipaumbele'
    },
    ts: {
      title: 'Swilo swo Sungula swa Mfumo',
      summary: 'Ku rhangisa Mfumo wa Xikwembu evuton\'wini bya hina.',
      full_transcript: 'Eka Matewu 6:33 Yesu u hi rhamba ku rhanga hi lava Mfumo wa Xikwembu ni ku lulama ka xona, kutani hinkwaswo swi ta engeteleriwa.',
      tags: 'Mfumo, Matewu, Vutomi'
    }
  },
  'O Fruto do Espírito na Prática': {
    en: {
      title: 'The Fruit of the Spirit in Practice',
      summary: 'Living out love, joy and patience in family and workplace relationships.',
      full_transcript: 'The apostle Paul writes in Galatians 5:22 about the fruit of the Spirit. It is not merely human effort, but a character shaped daily by the Holy Spirit with gentleness and self-control.',
      tags: 'Fruit of the Spirit, Relationships, Character'
    },
    es: {
      title: 'El Fruto del Espíritu en la Práctica',
      summary: 'Manifestando amor, gozo y paciencia en las relaciones familiares y laborales.',
      full_transcript: 'El apóstol Pablo escribe en Gálatas 5:22 sobre el fruto del Espíritu. No se trata de un esfuerzo puramente humano, sino de un carácter moldeado diariamente por el Espíritu Santo con mansedumbre y dominio propio.',
      tags: 'Fruto del Espíritu, Relaciones, Carácter'
    },
    fr: {
      title: 'Le Fruit de l\'Esprit en Pratique',
      summary: 'Manifester l\'amour, la joie et la patience dans les relations familiales et professionnelles.',
      full_transcript: 'L\'apôtre Paul écrit dans Galates 5:22 au sujet du fruit de l\'Esprit. Il ne s\'agit pas d\'un effort purement humain, mais d\'un caractère façonné chaque jour par le Saint-Esprit.',
      tags: 'Fruit de l\'Esprit, Relations, Caractère'
    },
    sw: {
      title: 'Tunda la Roho katika Matendo',
      summary: 'Kudhihirisha upendo, furaha na uvumilivu katika familia na mahali pa kazi.',
      full_transcript: 'Mtume Paulo anaandika katika Wagalatia 5:22 juu ya tunda la Roho. Si juhudi za kibinadamu pekee, bali ni tabia inayoundwa kila siku na Roho Mtakatifu.',
      tags: 'Tunda la Roho, Mahusiano, Tabia'
    },
    ts: {
      title: 'Mbhandzu wa Moya eka Swiendlo',
      summary: 'Ku kombisa rirhandzu, ntsako ni ku leha mbilu masiku hinkwawo.',
      full_transcript: 'Muapostola Pawulo u tsala eka Vagalatiya 5:22 hi mbhandzu wa Moya lowo Kwetsima: rirhandzu, ntsako ni ku rhula.',
      tags: 'Moya, Rirhandzu, Mahanyelo'
    }
  },
  'Nova Criatura em Cristo': {
    en: {
      title: 'A New Creation in Christ',
      summary: 'The fresh start that forgiveness brings: leaving the past behind.',
      full_transcript: 'If anyone is in Christ, the old things have passed away! As written in 2 Corinthians 5:17, all things have become new. Do not let past guilt imprison your future. You have been forgiven and reconciled to the Father.',
      tags: 'New Beginning, Forgiveness, Grace'
    },
    es: {
      title: 'Nueva Criatura en Cristo',
      summary: 'El nuevo comienzo que brinda el perdón: dejando el pasado atrás.',
      full_transcript: '¡Si alguno está en Cristo, las cosas viejas pasaron! Como dice 2 Corintios 5:17, todas son hechas nuevas. No permitas que las culpas antiguas aprisionen tu futuro. Has sido perdonado y reconciliado con el Padre.',
      tags: 'Nuevo Comienzo, Perdón, Gracia'
    },
    fr: {
      title: 'Nouvelle Créature en Christ',
      summary: 'Le nouveau départ qu\'offre le pardon : laisser le passé derrière soi.',
      full_transcript: 'Si quelqu\'un est en Christ, les choses anciennes sont passées ! Comme le dit 2 Corinthiens 5:17, toutes choses sont devenues nouvelles. Ne laissez plus les fautes du passé emprisonner votre avenir.',
      tags: 'Nouveau Départ, Pardon, Grâce'
    },
    sw: {
      title: 'Kiumbe Kipya ndani ya Kristo',
      summary: 'Mwanzo mpya unaoletwa na msamaha: kuacha yaliyopita nyuma.',
      full_transcript: 'Mtu akiwa ndani ya Kristo amekuwa kiumbe kipya! Kama ilivyoandikwa katika 2 Wakorintho 5:17, ya kale yamepita na yote yamekuwa mapya. Umesamehewa na kupatanishwa na Baba.',
      tags: 'Mwanzo Mpya, Msamaha, Neema'
    },
    ts: {
      title: 'Xivumbiwa Lexintshwa eka Kreste',
      summary: 'Masungulo lamantshwa ya ku rivaleriwa.',
      full_transcript: 'Loko munhu a ri eka Kreste i xivumbiwa lexintshwa, hilaha 2 Vakorinto 5:17 yi vulaka hakona. Swilo swa khale swi hundzile.',
      tags: 'Masungulo, Ku Rivaleriwa, Tintswalo'
    }
  },
  'Confiança Inabalável': {
    en: {
      title: 'Unshakable Trust',
      summary: 'Learning to depend on God\'s counsel in crucial decisions of life.',
      full_transcript: 'Proverbs 3:5 advises with wisdom: trust in the Lord with all your heart and lean not on your own understanding. Often our vision is limited, but God\'s ways are perfect.',
      tags: 'Wisdom, Proverbs, Trust'
    },
    es: {
      title: 'Confianza Inquebrantable',
      summary: 'Aprendiendo a depender del consejo de Dios en decisiones cruciales de la vida.',
      full_transcript: 'Proverbios 3:5 aconseja con sabiduría: fía en el Señor de todo tu corazón, y no te apoyes en tu propia prudencia. Muchas veces nuestra visión es limitada, pero los caminos de Dios son perfectos.',
      tags: 'Sabiduría, Proverbios, Confianza'
    },
    fr: {
      title: 'Confiance Inébranlable',
      summary: 'Apprendre à dépendre du conseil de Dieu dans les décisions cruciales de la vie.',
      full_transcript: 'Proverbes 3:5 conseille avec sagesse : confie-toi en l\'Éternel de tout ton cœur et ne t\'appuie pas sur ta propre sagesse. Notre vision est limitée, mais les voies de Dieu sont parfaites.',
      tags: 'Sagesse, Proverbes, Confiance'
    },
    sw: {
      title: 'Imani Isiyotikisika',
      summary: 'Kujifunza kutegemea ushauri wa Mungu katika maamuzi muhimu ya maisha.',
      full_transcript: 'Mithali 3:5 inashauri kwa hekima: Mtumaini Bwana kwa moyo wako wote, wala usizitegemee akili zako mwenyewe. Njia za Mungu ni kamilifu.',
      tags: 'Hekima, Mithali, Tumaini'
    },
    ts: {
      title: 'Ku Tshemba loku Nga Tsekatsekiki',
      summary: 'Ku dyondza ku tshemba vutlhari bya Xikwembu.',
      full_transcript: 'Swivuriso 3:5 yi ri tshemba Hosi hi mbilu ya wena hinkwayo, u nga tshembi ku twisisa ka wena n\'wini.',
      tags: 'Vutlhari, Swivuriso, Ku Tshemba'
    }
  },
  'Planos de Paz e Esperança': {
    en: {
      title: 'Plans of Peace and Hope',
      summary: 'A prophetic message about God\'s care for the future of our community.',
      full_transcript: 'God says in Jeremiah 29:11 that the thoughts He thinks toward us are thoughts of peace and not of evil, to give us an expected end. You are neither alone nor forsaken. The Lord prepares a future full of hope and purpose.',
      tags: 'Future, Jeremiah, Peace'
    },
    es: {
      title: 'Planes de Paz y Esperanza',
      summary: 'Un mensaje profético sobre el cuidado de Dios por el futuro de nuestra comunidad.',
      full_transcript: 'Dios dice en Jeremías 29:11 que los pensamientos que tiene acerca de nosotros son de paz y no de mal, para darnos un futuro y una esperanza. No estás solo ni desamparado.',
      tags: 'Futuro, Jeremías, Paz'
    },
    fr: {
      title: 'Projets de Paix et d\'Espérance',
      summary: 'Un message prophétique sur le soin de Dieu pour l\'avenir de notre communauté.',
      full_transcript: 'Dieu déclare dans Jérémie 29:11 que les projets qu\'Il forme sur nous sont des projets de paix et non de malheur, afin de nous donner un avenir et de l\'espérance.',
      tags: 'Avenir, Jérémie, Paix'
    },
    sw: {
      title: 'Mipango ya Amani na Tumaini',
      summary: 'Ujumbe wa kinabii kuhusu utunzaji wa Mungu kwa mustakabali wa jamii yetu.',
      full_transcript: 'Mungu anasema katika Yeremia 29:11 kwamba mawazo anayotuwazia ni mawazo ya amani wala si ya mabaya, kutupa tumaini siku za mwisho. Hauko peke yako.',
      tags: 'Mustakabali, Yeremia, Amani'
    },
    ts: {
      title: 'Makungu ya Ku Rhula ni Ntshembo',
      summary: 'Mahungu ya ku hlayisa ka Xikwembu vumundzuku bya hina.',
      full_transcript: 'Xikwembu xi vula eka Yeremiya 29:11 leswaku makungu ya xona eka hina i ya ku rhula ni ntshembo, ku nga ri ya khombo.',
      tags: 'Vumundzuku, Yeremiya, Ku Rhula'
    }
  },
  'Fortalecidos para Vencer': {
    en: {
      title: 'Strengthened to Overcome',
      summary: 'The sufficiency of Christ in every circumstance and season of life.',
      full_transcript: 'The apostle Paul in prison declared in Philippians 4:13: I can do all things through Christ who strengthens me. This declaration is not about accumulating material wealth, but about having contentment and peace in every season of life.',
      tags: 'Victory, Philippians, Contentment'
    },
    es: {
      title: 'Fortalecidos para Vencer',
      summary: 'La suficiencia de Cristo en cualquier circunstancia y etapa de la vida.',
      full_transcript: 'El apóstol Pablo en prisión declaró en Filipenses 4:13: todo lo puedo en Cristo que me fortalece. Esta declaración habla de tener contentamiento y paz en cualquier estación de la vida.',
      tags: 'Victoria, Filipenses, Contentamiento'
    },
    fr: {
      title: 'Fortifiés pour Vaincre',
      summary: 'La suffisance de Christ dans toute circonstance et chaque saison de la vie.',
      full_transcript: 'L\'apôtre Paul en prison déclara dans Philippiens 4:13 : je puis tout par celui qui me fortifie. Cette parole révèle le secret du contentement et de la paix en toute saison.',
      tags: 'Victoire, Philippiens, Contentement'
    },
    sw: {
      title: 'Kutiwa Nguvu ili Kushinda',
      summary: 'Utoshelevu wa Kristo katika kila hali na msimu wa maisha.',
      full_transcript: 'Mtume Paulo akiwa gerezani alitangaza katika Wafilipi 4:13: Nayaweza mambo yote katika yeye anitiaye nguvu. Hii inahusu kuwa na amani na kuridhika katika kila majira ya maisha.',
      tags: 'Ushindi, Wafilipi, Amani'
    },
    ts: {
      title: 'Ku Tiyisiwa ku Hlula',
      summary: 'Matimba ya Kreste eka swiyimo hinkwaswo swa vutomi.',
      full_transcript: 'Muapostola Pawulo u te eka Vafilipiya 4:13: Ndzi nga endla swilo hinkwaswo hi loyi a ndzi nyikaka matimba.',
      tags: 'Ku Hlula, Vafilipiya, Ku Rhula'
    }
  }
};

// Cache em memória para cultos customizados traduzidos via ML Kit
const dynamicWorshipCache = new Map<string, WorshipService>();

export async function translateWorshipRecord(
  worship: WorshipService,
  targetLang: SupportedLanguage
): Promise<WorshipService> {
  if (!worship || targetLang === 'pt') {
    return worship;
  }

  // 1. Verifica tradução nativa instantânea para os cultos pré-cadastrados (seeds)
  const seededMatch = SEEDED_WORSHIP_TRANSLATIONS[worship.title?.trim()];
  if (seededMatch && seededMatch[targetLang]) {
    const loc = seededMatch[targetLang]!;
    return {
      ...worship,
      title: loc.title,
      summary: loc.summary,
      full_transcript: loc.full_transcript,
      tags: loc.tags
    };
  }

  // 2. Verifica cache de tradução dinâmica (para cultos cadastrados/gravados pelo usuário)
  const cacheKey = `${worship.id}_${worship.updated_at || ''}_${targetLang}`;
  if (dynamicWorshipCache.has(cacheKey)) {
    return dynamicWorshipCache.get(cacheKey)!;
  }

  // 3. Traduz sob demanda 100% offline via Google ML Kit (quando o pacote do idioma estiver disponível)
  if (targetLang === 'ts') {
    return worship;
  }

  const pairReady = await TranslationService.isPairDownloaded('pt', targetLang);
  if (!pairReady) {
    return worship;
  }

  try {
    const [tTitle, tSummary, tTranscript, tTags] = await Promise.all([
      worship.title ? TranslationService.translate(worship.title, 'pt', targetLang) : Promise.resolve(''),
      worship.summary ? TranslationService.translateLongText(worship.summary, 'pt', targetLang) : Promise.resolve(''),
      worship.full_transcript ? TranslationService.translateLongText(worship.full_transcript, 'pt', targetLang) : Promise.resolve(''),
      worship.tags ? TranslationService.translate(worship.tags, 'pt', targetLang) : Promise.resolve('')
    ]);

    const translated: WorshipService = {
      ...worship,
      title: tTitle || worship.title,
      summary: tSummary || worship.summary,
      full_transcript: tTranscript || worship.full_transcript,
      tags: tTags || worship.tags
    };
    dynamicWorshipCache.set(cacheKey, translated);
    return translated;
  } catch {
    return worship;
  }
}

/**
 * Hook reativo que entrega automaticamente uma lista de cultos no idioma selecionado no topo do aplicativo.
 */
export function useTranslatedWorships(
  worships: WorshipService[],
  targetLang: SupportedLanguage
): { items: WorshipService[]; isTranslating: boolean } {
  const [items, setItems] = useState<WorshipService[]>(worships);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!worships || worships.length === 0 || targetLang === 'pt') {
      setItems(worships);
      setIsTranslating(false);
      return;
    }

    // Aplica imediatamente as traduções instantâneas (seeds/cache) sem piscar a tela
    const quickMapped = worships.map(w => {
      const seeded = SEEDED_WORSHIP_TRANSLATIONS[w.title?.trim()]?.[targetLang];
      if (seeded) {
        return { ...w, ...seeded };
      }
      const cacheKey = `${w.id}_${w.updated_at || ''}_${targetLang}`;
      return dynamicWorshipCache.get(cacheKey) || w;
    });
    setItems(quickMapped);

    // Verifica se existe algum culto customizado que precise de ML Kit assíncrono
    const needsDynamic = worships.some(w => {
      const seeded = SEEDED_WORSHIP_TRANSLATIONS[w.title?.trim()]?.[targetLang];
      const cacheKey = `${w.id}_${w.updated_at || ''}_${targetLang}`;
      return !seeded && !dynamicWorshipCache.has(cacheKey);
    });

    if (!needsDynamic) {
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    Promise.all(worships.map(w => translateWorshipRecord(w, targetLang)))
      .then(results => {
        if (!cancelled) {
          setItems(results);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsTranslating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [worships, targetLang]);

  return { items, isTranslating };
}
