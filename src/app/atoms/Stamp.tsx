import React, { HTMLAttributes } from 'react';

import classNames from 'clsx';

type StampProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  color?: string;
};

const Stamp: React.FC<StampProps> = ({ label, color = '#D23', className, style }) => {
  return (
    <div
      className={classNames(
        'absolute font-bold font-mono font text-2xl inline-block rounded-2xl uppercase py-1 px-3',
        className
      )}
      style={{ border: `0.5rem double ${color}`, transform: 'rotate(45deg)', color, ...style }}
    >
      {label}
    </div>
  );
};

export default Stamp;
