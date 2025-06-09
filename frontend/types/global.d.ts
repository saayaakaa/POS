// バーコードスキャナー用の型定義

declare global {
  interface Navigator {
    permissions: {
      query(permissionDesc: { name: PermissionName }): Promise<PermissionStatus>;
    };
  }

  interface MediaDevices {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  }
}

export {}; 