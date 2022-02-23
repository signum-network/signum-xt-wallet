import React, { CSSProperties, memo, SVGProps } from 'react';

import { ReactComponent as BlueLogo } from 'app/misc/logo-blue.svg';
import { ReactComponent as LogoTitle } from 'app/misc/logo-title.svg';
import { ReactComponent as WhiteLogoTitle } from 'app/misc/logo-white-title.svg';
import { ReactComponent as WhiteLogo } from 'app/misc/logo-white.svg';
import { ReactComponent as XTLogo } from 'app/misc/logo-xt.svg';

type LogoProps = SVGProps<SVGSVGElement> & {
  hasTitle?: boolean;
  white?: boolean;
  xt?: boolean;
  style?: CSSProperties;
};

const Logo = memo<LogoProps>(({ hasTitle, white, xt, style = {}, ...rest }) => {
  const whiteLogoType = hasTitle ? WhiteLogoTitle : WhiteLogo;
  const plainLogoType = hasTitle ? LogoTitle : BlueLogo;
  let Component = white ? whiteLogoType : plainLogoType;
  Component = xt ? XTLogo : Component;

  return (
    <Component
      title="Signum XT Wallet"
      style={{
        height: 40,
        width: 'auto',
        marginTop: 6,
        marginBottom: 6,
        ...style
      }}
      {...rest}
    />
  );
});

export default Logo;
