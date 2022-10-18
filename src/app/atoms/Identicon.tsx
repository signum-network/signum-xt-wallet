import React, { FC, HTMLAttributes, useMemo } from 'react';

import Avatars from '@dicebear/avatars';
import botttsSprites from '@dicebear/avatars-bottts-sprites';
import jdenticonSpirtes from '@dicebear/avatars-jdenticon-sprites';
import classNames from 'clsx';

import initialsSprites from 'lib/avatars-initials-sprites';
import { identiheart } from 'lib/ui/identiheart';

type IdenticonProps = HTMLAttributes<HTMLDivElement> & {
  type?: 'jdenticon' | 'bottts' | 'initials' | 'hearts';
  hash: string;
  size?: number;
};

const MAX_INITIALS_LENGTH = 5;
const DEFAULT_FONT_SIZE = 50;

const cache = new Map<string, string>();

const icons: Record<string, Avatars<{}>> = {
  jdenticon: new Avatars(jdenticonSpirtes),
  bottts: new Avatars(botttsSprites),
  initials: new Avatars(initialsSprites)
};

const Identicon: FC<IdenticonProps> = ({ type = 'jdenticon', hash, size = 100, className, style = {}, ...rest }) => {
  const backgroundImage = useMemo(() => {
    const key = `${type}_${hash}_${size}`;
    if (cache.has(key)) {
      return cache.get(key);
    } else {
      const basicOpts = {
        base64: true,
        width: size,
        height: size,
        margin: 4
      };

      let opts: any = basicOpts;
      let imgSrc: string = '';
      switch (type) {
        case 'hearts':
          imgSrc = identiheart({ digest: hash }).toDataURL();
          break;
        case 'initials':
          opts = {
            ...basicOpts,
            chars: MAX_INITIALS_LENGTH,
            radius: 50,
            fontSize: estimateOptimalFontSize(hash.slice(0, MAX_INITIALS_LENGTH).length)
          };
        // eslint-disable-next-line no-fallthrough
        default:
          imgSrc = icons[type].create(hash, opts);
      }

      const bi = `url('${imgSrc}')`;
      cache.set(key, bi);
      return bi;
    }
  }, [type, hash, size]);

  return (
    <div
      className={classNames(
        'inline-block',
        type === 'initials' || type === 'hearts' ? 'bg-transparent' : 'bg-gray-100',
        'bg-no-repeat bg-center bg-cover',
        'overflow-hidden',
        className
      )}
      style={{
        backgroundImage,
        width: size,
        height: size,
        borderRadius: Math.round(size / 10),
        ...style
      }}
      {...rest}
    />
  );
};

export default Identicon;

function estimateOptimalFontSize(length: number) {
  const initialsLength = Math.min(length, MAX_INITIALS_LENGTH);
  if (initialsLength > 2) {
    const n = initialsLength;
    const multiplier = Math.sqrt(10000 / ((32 * n + 4 * (n - 1)) ** 2 + 36 ** 2));
    return Math.floor(DEFAULT_FONT_SIZE * multiplier);
  }
  return DEFAULT_FONT_SIZE;
}
