import { Player, UpgradeOption } from './types';

export const ALL_UPGRADES: UpgradeOption[] = [
  {
    id: 'multishot',
    title: '플라즈마 멀티샷',
    desc: '동시에 발사되는 플라즈마 탄환이 1발 증가합니다.',
    icon: 'Sparkles',
    rarity: 'rare',
  },
  {
    id: 'rapid_fire',
    title: '초고속 트리거',
    desc: '무기 공격 속도가 35% 빨라집니다.',
    icon: 'Zap',
    rarity: 'common',
  },
  {
    id: 'damage_boost',
    title: '오버클럭 코어',
    desc: '모든 공격력이 40% 대폭 증가합니다.',
    icon: 'Crosshair',
    rarity: 'rare',
  },
  {
    id: 'orbiters',
    title: '플라즈마 가디언 오브',
    desc: '플레이어 주변을 고속 회전하며 접근하는 적을 분쇄하는 보호 구체를 1기 소환합니다.',
    icon: 'Shield',
    rarity: 'legendary',
  },
  {
    id: 'thruster',
    title: '하이퍼 부스터',
    desc: '이동 속도 20% 상승 및 대시 쿨다운이 30% 감소합니다.',
    icon: 'FastForward',
    rarity: 'common',
  },
  {
    id: 'magnet',
    title: '중력자 마그넷',
    desc: 'XP 젬과 에너지 흡수 반경이 150% 증가합니다.',
    icon: 'Magnet',
    rarity: 'common',
  },
  {
    id: 'titanium_hull',
    title: '나노 티타늄 장갑',
    desc: '최대 체력이 40 증가하고, 손상된 체력을 즉시 50 회복합니다.',
    icon: 'Heart',
    rarity: 'rare',
  },
  {
    id: 'nova_reactor',
    title: '노바 초압축 반응로',
    desc: 'Q 전방위 노바 폭탄의 재충전 시간이 35% 단축됩니다.',
    icon: 'Bomb',
    rarity: 'legendary',
  },
];

export function getRandomUpgrades(count = 3): UpgradeOption[] {
  const shuffled = [...ALL_UPGRADES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function applyUpgrade(player: Player, upgradeId: string) {
  switch (upgradeId) {
    case 'multishot':
      player.multishot += 1;
      break;
    case 'rapid_fire':
      player.fireRate *= 1.35;
      break;
    case 'damage_boost':
      player.damage = Math.round(player.damage * 1.4);
      break;
    case 'orbiters':
      player.orbitersCount += 1;
      break;
    case 'thruster':
      player.speed *= 1.2;
      player.dashCooldown = Math.max(0.6, player.dashCooldown * 0.7);
      break;
    case 'magnet':
      player.magnetRadius *= 2.5;
      break;
    case 'titanium_hull':
      player.maxHealth += 40;
      player.health = Math.min(player.maxHealth, player.health + 50);
      break;
    case 'nova_reactor':
      player.novaCooldown = Math.max(4, player.novaCooldown * 0.65);
      break;
  }
}
