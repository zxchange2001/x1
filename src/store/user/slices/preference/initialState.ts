import { SessionDefaultGroup, SessionGroupId } from '@/types/session';
import { AsyncLocalStorage } from '@/utils/localStorage';

export interface Guide {
  // Topic 引导
  topic?: boolean;
}

export interface GlobalPreference {
  // which sessionGroup should expand
  expandSessionGroupKeys: SessionGroupId[];
  guide?: Guide;
  hideSyncAlert?: boolean;
  inputHeight: number;
  mobileShowTopic?: boolean;

  sessionsWidth: number;
  showChatSideBar?: boolean;
  showSessionPanel?: boolean;
  showSystemRole?: boolean;
  telemetry: boolean | null;

  /**
   * whether to use cmd + enter to send message
   */
  useCmdEnterToSend?: boolean;
}

export interface UserPreferenceState {
  /**
   * the user preference, which only store in local storage
   */
  preference: GlobalPreference;
  preferenceStorage: AsyncLocalStorage<GlobalPreference>;
}

export const initialPreferenceState: UserPreferenceState = {
  preference: {
    expandSessionGroupKeys: [SessionDefaultGroup.Pinned, SessionDefaultGroup.Default],
    guide: {},
    inputHeight: 200,
    mobileShowTopic: false,
    sessionsWidth: 320,
    showChatSideBar: true,
    showSessionPanel: true,
    showSystemRole: false,
    telemetry: null,
    useCmdEnterToSend: false,
  },
  preferenceStorage: new AsyncLocalStorage('LOBE_PREFERENCE'),
};
